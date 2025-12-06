"use client";

import { useState, useRef, useEffect } from "react";

export function usePdf() {
	const [file, setFile] = useState<File | null>(null);
	const pdfTextRef = useRef<string>("");
	const pageTextsRef = useRef<string[]>([]);
	const deckSummaryRef = useRef<string>("");

	useEffect(() => {
		if (!file) {
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

				if (!res.ok) throw new Error("PDF processing failed");

				const data = await res.json();
				if (!data.text && !Array.isArray(data.pages)) {
					throw new Error("PDF processing returned no text");
				}

				if (data.text) {
					pdfTextRef.current = data.text; // full deck text
					deckSummaryRef.current = data.summary || data.text.slice(0, 1200);
					console.log(
						"📄 PDF Context Loaded:",
						data.text.slice(0, 100) + "..."
					);
				}
				if (Array.isArray(data.pages)) {
					pageTextsRef.current = data.pages;
				}
			} catch (error) {
				console.error("Failed to extract PDF text:", error);
				alert("PDF upload failed. Please try again.");
				setFile(null);
			}
		};

		extractPdfText();
	}, [file]);

	return {
		file,
		setFile,
		pdfTextRef,
		pageTextsRef,
		deckSummaryRef,
	};
}
