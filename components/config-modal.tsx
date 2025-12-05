"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConfigModal({ isOpen, onClose }: ConfigModalProps) {
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedOpenaiKey = localStorage.getItem('openaiApiKey') || '';
      setOpenaiApiKey(storedOpenaiKey);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('openaiApiKey', openaiApiKey);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
        // Reload to apply new key
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Configuration</h2>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    type={showOpenaiKey ? "text" : "password"}
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="Enter your OpenAI API key..."
                    className="w-full px-4 py-2 pr-10 bg-black/50 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <button
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  >
                    {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Required for AI-powered roasts using GPT-4.
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-300">
                  <strong>AI Services:</strong>
                  <br />• STT: Web Speech API (browser built-in, free)
                  <br />• TTS: Speech Synthesis API (browser built-in, free)
                  <br />• LLM: OpenAI GPT-4 (AI roasts)
                </p>
              </div>

              <button
                onClick={handleSave}
                disabled={!openaiApiKey || saved}
                className={cn(
                  "w-full px-4 py-2 rounded-lg font-medium transition-all",
                  saved
                    ? "bg-green-600 text-white"
                    : openaiApiKey
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                )}
              >
                {saved ? "✓ Saved!" : "Save Configuration"}
              </button>

              {!openaiApiKey && (
                <p className="text-xs text-yellow-400 text-center">
                  Without an API key, AI roasts will not be available. You'll still get transcription and interrupt detection.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
