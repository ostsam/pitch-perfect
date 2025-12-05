"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FileUpload } from "@/components/file-upload";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Aperture } from "lucide-react";
import { Orb } from "@/components/orb";
import { CameraFeed } from "@/components/camera-feed";
import { cn } from "@/lib/utils";
import type { FaceData } from "@/hooks/use-face-detection";

export interface RoastMessage {
	id: string;
	text: string;
	severity: "info" | "warning" | "critical";
	timestamp: number;
}

const PdfViewer = dynamic(
	() => import("@/components/pdf-viewer").then((mod) => mod.PdfViewer),
	{
		ssr: false,
		loading: () => null,
	}
);

export default function Home() {
	const [file, setFile] = useState<File | null>(null);
	const [isRoasting, setIsRoasting] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [roasts, setRoasts] = useState<RoastMessage[]>([]);
	const [micVolume, setMicVolume] = useState(0);
	const [showCamera, setShowCamera] = useState(false);

	// State for the "Brain"
	const [currentFaceData, setCurrentFaceData] = useState<FaceData | null>(null); // For UI rendering
	const pdfTextRef = useRef<string>(""); // Ref for the interval to access fresh data
	const transcriptRef = useRef<string>("");
	const faceDataRef = useRef<FaceData | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
	const rafRef = useRef<number | null>(null);
	const micStreamRef = useRef<MediaStream | null>(null);

	// Connection refs
	const socketRef = useRef<WebSocket | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		setMounted(true);
		audioRef.current = new Audio();
	}, []);

	// 1. Handle PDF Upload & Text Extraction
	useEffect(() => {
		if (!file) {
			pdfTextRef.current = "";
			return;
		}

		const extractPdfText = async () => {
			const formData = new FormData();
			formData.append("file", file);

			try {
				const res = await fetch("/api/process-pdf", {
					method: "POST",
					body: formData,
				});
				const data = await res.json();
				if (data.text) {
					pdfTextRef.current = data.text; // Update ref
					console.log(
						"📄 PDF Context Loaded:",
						data.text.slice(0, 100) + "..."
					);
				}
			} catch (error) {
				console.error("Failed to extract PDF text:", error);
			}
		};

		extractPdfText();
	}, [file]);

	const stopAudioAnalysis = useCallback(() => {
		if (rafRef.current !== null) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
		if (audioContextRef.current) {
			audioContextRef.current.close().catch(() => {});
			audioContextRef.current = null;
		}
		analyserRef.current = null;
		dataArrayRef.current = null;
		setMicVolume(0);
	}, []);

	const startAudioAnalysis = useCallback(
		(stream: MediaStream) => {
			// Defensive cleanup before starting
			stopAudioAnalysis();

			const audioCtxConstructor =
				window.AudioContext ||
				(window as typeof window & { webkitAudioContext?: typeof AudioContext })
					.webkitAudioContext;
			if (!audioCtxConstructor) return;
			const audioCtx = new audioCtxConstructor();
			const analyser = audioCtx.createAnalyser();
			analyser.fftSize = 512;
			const bufferLength = analyser.frequencyBinCount;
			const dataArray = new Uint8Array(
				new ArrayBuffer(bufferLength)
			) as Uint8Array<ArrayBuffer>;

			const source = audioCtx.createMediaStreamSource(stream);
			source.connect(analyser);

			audioContextRef.current = audioCtx;
			analyserRef.current = analyser;
			dataArrayRef.current = dataArray;

			const updateVolume = () => {
				if (!analyserRef.current || !dataArrayRef.current) return;
				analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

				// Compute RMS from time-domain data (0-255), normalize to 0..1
				let sumSquares = 0;
				for (let i = 0; i < dataArrayRef.current.length; i++) {
					const v = (dataArrayRef.current[i] - 128) / 128; // center to -1..1
					sumSquares += v * v;
				}
				const rms = Math.sqrt(sumSquares / dataArrayRef.current.length);
				setMicVolume(Math.min(1, rms * 2)); // scale a bit for visual pop

				rafRef.current = requestAnimationFrame(updateVolume);
			};

			rafRef.current = requestAnimationFrame(updateVolume);
		},
		[stopAudioAnalysis]
	);

	const triggerRoast = useCallback(async (text: string) => {
		console.log("🔥 ROAST TRIGGERED:", text);

		// Add to UI
		const newRoast: RoastMessage = {
			id: Date.now().toString(),
			text,
			severity: "critical",
			timestamp: Date.now(),
		};
		setRoasts((prev) => [...prev, newRoast]);

		// Play Audio
		try {
			// We fetch the stream then play it.
			// Since audio elements need a source, we can fetch as blob.
			const res = await fetch("/api/speak", {
				method: "POST",
				body: JSON.stringify({ text }),
			});

			const blob = await res.blob();
			const url = URL.createObjectURL(blob);

			if (audioRef.current) {
				audioRef.current.src = url;
				audioRef.current.play();
			}

			// Clear transcript buffer so we don't re-analyze old mistakes
			transcriptRef.current = "";
		} catch (error) {
			console.error("Failed to speak:", error);
		}
	}, []);

	const analyzePitch = useCallback(async () => {
		// Don't interrupt if already speaking
		if (audioRef.current && !audioRef.current.paused) return;

		const transcript = transcriptRef.current.slice(-500); // Last ~500 chars
		const faceData = faceDataRef.current;
		const currentPdfText = pdfTextRef.current; // Use ref here

		// If no PDF text yet, we can't really judge context, but we can judge emotion.
		// However, the API requires pdfContext.
		if (!currentPdfText) {
			console.log("Waiting for PDF text...");
			return;
		}

		if (!transcript.trim() && !faceData) return; // Nothing to analyze

		// Format emotion string
		let emotionData = "No face detected";
		if (faceData) {
			emotionData = `Dominant: ${faceData.dominantEmotion} (${(
				faceData.confidence * 100
			).toFixed(0)}%)`;
			// Add top 2 secondary emotions
			const secondary = Object.entries(faceData.emotions)
				.sort(([, a], [, b]) => b - a)
				.slice(1, 3)
				.map(([e, v]) => `${e} (${(v * 100).toFixed(0)}%)`)
				.join(", ");
			if (secondary) emotionData += ` | Secondary: ${secondary}`;
		}

		try {
			const res = await fetch("/api/analyze-pitch", {
				method: "POST",
				body: JSON.stringify({
					transcript,
					emotionData,
					pdfContext: currentPdfText,
					previousRoasts: roasts.map((r) => r.text),
				}),
			});

			const result = await res.json();

			if (result.shouldInterrupt && result.roastMessage) {
				triggerRoast(result.roastMessage);
			}
		} catch (error) {
			console.error("Brain glitch:", error);
		}
	}, [roasts, triggerRoast]);

	// 2. Deepgram & Microphone Setup
	useEffect(() => {
		if (!isRoasting || !file) {
			// Cleanup
			socketRef.current?.close();
			mediaRecorderRef.current?.stop();
			if (analysisIntervalRef.current)
				clearInterval(analysisIntervalRef.current);
			return;
		}

		const startSession = async () => {
			try {
				// A. Get Token
				const tokenRes = await fetch("/api/get-deepgram-token");
				const { key } = await tokenRes.json();

				if (!key) throw new Error("No Deepgram key");

				// B. Setup WebSocket
				const socket = new WebSocket(
					"wss://api.deepgram.com/v1/listen?smart_format=true&model=nova-2&language=en-US",
					["token", key]
				);

				socket.onopen = () => {
					console.log("🟢 Connected to Deepgram");

					// C. Start Microphone
					navigator.mediaDevices
						.getUserMedia({ audio: true })
						.then((stream) => {
							micStreamRef.current = stream;
							startAudioAnalysis(stream);

							const mediaRecorder = new MediaRecorder(stream);
							mediaRecorderRef.current = mediaRecorder;

							mediaRecorder.addEventListener("dataavailable", (event) => {
								if (event.data.size > 0 && socket.readyState === 1) {
									socket.send(event.data);
								}
							});

							mediaRecorder.start(250); // Send chunks every 250ms
						});
				};

				socket.onmessage = (message) => {
					const received = JSON.parse(message.data);
					const transcript = received.channel?.alternatives[0]?.transcript;
					if (transcript && received.is_final) {
						transcriptRef.current += " " + transcript;
						// Keep transcript buffer manageable (last 1000 chars)
						if (transcriptRef.current.length > 2000) {
							transcriptRef.current = transcriptRef.current.slice(-2000);
						}
					}
				};

				socketRef.current = socket;

				// D. Start Analysis Loop (The "Brain")
				analysisIntervalRef.current = setInterval(analyzePitch, 4000); // Check every 4 seconds
			} catch (error) {
				console.error("Failed to start session:", error);
				setIsRoasting(false);
			}
		};

		startSession();

		return () => {
			socketRef.current?.close();
			mediaRecorderRef.current?.stop();
			stopAudioAnalysis();
			micStreamRef.current?.getTracks().forEach((track) => track.stop());
			if (analysisIntervalRef.current)
				clearInterval(analysisIntervalRef.current);
		};
	}, [analyzePitch, isRoasting, file, startAudioAnalysis, stopAudioAnalysis]);

	const handleFaceData = (data: FaceData | null) => {
		faceDataRef.current = data;
		setCurrentFaceData(data);
	};

	if (!mounted) return null;

	return (
		<main className="h-screen w-full bg-[#020202] text-white overflow-hidden flex flex-col selection:bg-white/20">
			{/* Ambient Background Mesh */}
			<div className="fixed inset-0 pointer-events-none z-0">
				<div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-900/05 blur-[150px] animate-pulse duration-10000ms" />
			</div>

			{/* Navbar */}
			<motion.header
				initial={{ y: -20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				className="relative z-50 flex-none px-8 py-4 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-sm"
			>
				<div
					className="flex items-center gap-3 cursor-pointer"
					onClick={() => {
						setFile(null);
						setIsRoasting(false);
					}}
				>
					<div className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center border border-white/10">
						<Aperture className="w-3 h-3 text-white" />
					</div>
					<span className="font-medium text-sm tracking-wide text-zinc-300">
						Pitch Perfect
					</span>
				</div>

				{file && (
					<div className="flex items-center gap-3">
						<button
							onClick={() => setIsRoasting(!isRoasting)}
							className={cn(
								"px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-2",
								isRoasting
									? "bg-red-600 text-white hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
									: "bg-white text-black hover:bg-zinc-200"
							)}
						>
							{isRoasting ? "Live Session" : "Start Session"}
						</button>
						<button
							onClick={() => setShowCamera((prev) => !prev)}
							className={cn(
								"px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all flex items-center gap-2 border border-white/10",
								showCamera
									? "bg-white text-black hover:bg-zinc-200"
									: "bg-black/40 text-white hover:bg-white/10"
							)}
						>
							{showCamera ? "Hide Camera" : "Show Camera"}
						</button>
					</div>
				)}
			</motion.header>

			{/* Content Stage */}
			<div className="flex-1 relative z-10 flex flex-col min-h-0 overflow-hidden">
				<AnimatePresence mode="wait">
					{!file ? (
						<motion.div
							key="hero"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
							transition={{ duration: 0.5 }}
							className="flex-1 flex flex-col items-center justify-center p-6 relative min-h-0 overflow-auto"
						>
							<div className="text-center space-y-6 max-w-4xl mb-12 relative z-20">
								<motion.h1
									initial={{ y: 20, opacity: 0 }}
									animate={{ y: 0, opacity: 1 }}
									className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40"
								>
									Pitch like your life depends on it.
								</motion.h1>
							</div>

							<motion.div
								initial={{ y: 40, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								transition={{ delay: 0.2 }}
								className="w-full max-w-xl relative z-20"
							>
								<FileUpload onFileSelect={setFile} />
							</motion.div>
						</motion.div>
					) : (
						<motion.div
							key="workspace"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="flex-1 flex flex-row gap-4 p-6 min-h-0 overflow-hidden"
						>
							{/* PDF takes majority / full width */}
							<div className="relative flex-1 h-full min-h-0 rounded-2xl border border-white/10 bg-[#050505] overflow-hidden shadow-2xl">
								<PdfViewer file={file} />
								{/* Docked mini orb + status (stacked) */}
								<div className="pointer-events-none absolute bottom-0.5 right-12 flex flex-col items-center gap-2 w-20">
									<div className="pointer-events-none flex items-center justify-center w-16 h-16 rounded-full bg-black/50 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-sm">
										<Orb
											active={isRoasting}
											volume={micVolume}
											sizeClass="w-12 h-12"
										/>
									</div>
									<div className="pointer-events-none px-2 py-1 rounded-full bg-black/60 border border-white/10 shadow-sm text-[10px] font-mono uppercase tracking-wide text-zinc-200 w-full text-center">
										{isRoasting ? "Listening" : "Idle"}
									</div>
								</div>
							</div>

							{/* Camera panel toggled */}
							{showCamera && (
								<div className="w-[280px] flex-none h-full min-h-0 flex flex-col gap-4 overflow-hidden">
									<div className="flex-1 rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl relative">
										<CameraFeed active={true} onFaceData={handleFaceData} />
									</div>

									{/* Face Analysis Debug */}
									<div className="h-1/3 relative rounded-2xl border border-white/5 bg-white/2 overflow-hidden">
										<div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/50 pointer-events-none z-10" />
										<div className="h-full flex flex-col p-4">
											<h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-3 border-b border-white/5 pb-2 flex-none">
												Face Analysis Debug
											</h3>

											{currentFaceData ? (
												<div className="flex-1 overflow-auto space-y-2 text-xs font-mono">
													<div className="flex justify-between items-center">
														<span className="text-zinc-400">Emotion:</span>
														<span className="text-white font-bold capitalize">
															{currentFaceData.dominantEmotion}
														</span>
													</div>
													<div className="flex justify-between items-center">
														<span className="text-zinc-400">Confidence:</span>
														<span className="text-green-400">
															{(currentFaceData.confidence * 100).toFixed(0)}%
														</span>
													</div>
													<div className="mt-3 pt-3 border-t border-white/5">
														<div className="text-zinc-500 mb-2 text-[10px]">
															All Emotions:
														</div>
														{Object.entries(currentFaceData.emotions)
															.sort(([, a], [, b]) => b - a)
															.slice(0, 4)
															.map(([emotion, value]) => (
																<div
																	key={emotion}
																	className="flex justify-between items-center mb-1"
																>
																	<span className="text-zinc-500 capitalize text-[11px]">
																		{emotion}:
																	</span>
																	<div className="flex items-center gap-2">
																		<div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
																			<div
																				className="h-full bg-blue-500 rounded-full transition-all"
																				style={{ width: `${value * 100}%` }}
																			/>
																		</div>
																		<span className="text-zinc-400 text-[10px] w-8 text-right">
																			{(value * 100).toFixed(0)}%
																		</span>
																	</div>
																</div>
															))}
													</div>
												</div>
											) : (
												<div className="flex-1 flex items-center justify-center text-zinc-600 text-xs">
													No face detected
												</div>
											)}
										</div>
									</div>
								</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</main>
	);
}
