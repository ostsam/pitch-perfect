"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { usePdf } from "@/hooks/use-pdf";
import { useAudioVisualizer } from "@/hooks/use-audio-visualizer";
import { useFaceStore } from "@/hooks/use-face-store";
import { useRoastSession } from "@/hooks/use-roast-session";
import { Navbar } from "@/components/layout/navbar";
import { HeroStage } from "@/components/layout/hero-stage";
import { WorkspaceStage } from "@/components/layout/workspace-stage";

export default function Home() {
	const [isRoasting, setIsRoasting] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [showCamera, setShowCamera] = useState(false);
	const currentPageRef = useRef<number>(1);

	// Hooks
	const { file, setFile, pdfTextRef, pageTextsRef, deckSummaryRef } = usePdf();
	const { micVolume, startAudioAnalysis, stopAudioAnalysis } =
		useAudioVisualizer();
	const { currentFaceData, faceDataRef, handleFaceData } = useFaceStore();

	useRoastSession({
		file,
		isRoasting,
		setIsRoasting,
		pdfTextRef,
		pageTextsRef,
		deckSummaryRef,
		faceDataRef,
		currentPageRef,
		onMicStreamCreated: startAudioAnalysis,
		onSessionEnd: stopAudioAnalysis,
	});

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setMounted(true);
	}, []);

	// Open camera by default on medium/large screens
	useEffect(() => {
		if (typeof window === "undefined") return;
		if (window.matchMedia("(min-width: 768px)").matches) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setShowCamera(true);
		}
	}, []);

	const handlePageChange = (page: number) => {
		currentPageRef.current = page;
	};

	const handleReset = () => {
		setFile(null);
		setIsRoasting(false);
	};

	if (!mounted) return null;

	return (
		<main className="h-screen w-full bg-[#020202] text-white overflow-hidden flex flex-col selection:bg-white/20">
			{/* Ambient Background Mesh */}
			<div className="fixed inset-0 pointer-events-none z-0">
				<div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-900/05 blur-[150px] animate-pulse duration-10000ms" />
			</div>

			<Navbar
				file={file}
				isRoasting={isRoasting}
				onToggleRoasting={() => setIsRoasting(!isRoasting)}
				showCamera={showCamera}
				onToggleCamera={() => setShowCamera((prev) => !prev)}
				onReset={handleReset}
			/>

			{/* Content Stage */}
			<div className="flex-1 relative z-10 flex flex-col min-h-0 overflow-hidden">
				<AnimatePresence mode="wait">
					{!file ? (
						<HeroStage onFileSelect={setFile} />
					) : (
						<WorkspaceStage
							file={file}
							onPageChange={handlePageChange}
							isRoasting={isRoasting}
							micVolume={micVolume}
							showCamera={showCamera}
							currentFaceData={currentFaceData}
							onFaceData={handleFaceData}
						/>
					)}
				</AnimatePresence>
			</div>
		</main>
	);
}
