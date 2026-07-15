import React, { useState } from "react";
import { PendingPermit } from "../types";

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: (newPermit: PendingPermit) => void;
}

export default function QuickCaptureModal({ isOpen, onClose, onItemAdded }: QuickCaptureModalProps) {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("Je voudrais noter de réserver le guide pour Muanda demain...");
  const [isListening, setIsListening] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const startListeningMock = () => {
    setIsListening(true);
    setMessage(null);
    let count = 0;
    const phrases = [
      "Je voudrais noter...",
      "Je voudrais noter de réserver le...",
      "Je voudrais noter de réserver le guide pour Muanda demain..."
    ];
    const timer = setInterval(() => {
      setTranscript(phrases[count]);
      setInputText(phrases[count]);
      count++;
      if (count >= phrases.length) {
        clearInterval(timer);
        setIsListening(false);
      }
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalNote = inputText || transcript;
    if (!finalNote.trim()) return;

    setIsProcessing(true);
    setMessage("Analyse Cognitive en cours via Gemini AI...");
    try {
      const response = await fetch("/api/voice-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteText: finalNote })
      });
      const data = await response.json();
      if (data.success) {
        onItemAdded(data.addedItem);
        setMessage(`Ajouté avec succès ! [Mode: ${data.mode === 'ai' ? 'Gemini AI' : 'Local Fallback'}]`);
        setTimeout(() => {
          setInputText("");
          onClose();
          setMessage(null);
        }, 1500);
      } else {
        setMessage("Erreur lors de l'enregistrement de la note.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Erreur réseau. Ajout local par défaut.");
      // Local fallback in case server fails
      const fallbackItem: PendingPermit = {
        id: `permit-${Date.now()}`,
        title: finalNote.length > 24 ? finalNote.substring(0, 24) + "..." : finalNote,
        subtitle: "Créé (Traitement local)",
        status: "PENDING",
        icon: "pending"
      };
      onItemAdded(fallbackItem);
      setTimeout(() => {
        setInputText("");
        onClose();
        setMessage(null);
      }, 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div 
      id="capture-modal" 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end justify-center"
      onClick={(e) => {
        if ((e.target as HTMLElement).id === "capture-modal") onClose();
      }}
    >
      <div className="bg-surface w-full max-w-xl rounded-t-3xl p-5 animate-slide-up space-y-6">
        <div className="w-12 h-1.5 bg-outline-variant rounded-full mx-auto mb-4"></div>
        
        <div className="flex justify-between items-center">
          <h2 className="font-sans text-headline-md font-bold text-primary">Capture Rapide</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-surface-variant"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="bg-surface-container-highest p-5 rounded-2xl flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={startListeningMock}
            disabled={isListening || isProcessing}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isListening 
                ? "bg-alert-time text-white animate-pulse" 
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            <span className="material-symbols-outlined text-[40px] fill">mic</span>
          </button>
          
          <p className="text-on-surface-variant font-mono text-label-sm uppercase tracking-wider text-center">
            {isListening ? "Écoute en cours..." : "Cliquez sur le micro pour parler"}
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <textarea
              className="w-full bg-surface-container p-4 rounded-xl text-on-surface italic border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary h-24 font-sans resize-none"
              placeholder='Écrivez ou dites quelque chose comme "Je voudrais réserver un guide pour Muanda demain..."'
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isProcessing}
            />

            {message && (
              <p className="text-center font-mono text-label-sm text-primary font-medium animate-pulse">
                {message}
              </p>
            )}

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 py-4 rounded-full border border-outline text-outline font-mono text-label-md hover:bg-surface-container-high transition-all"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isProcessing || (!inputText.trim() && !transcript.trim())}
                className="flex-1 py-4 rounded-full bg-primary text-on-primary font-mono text-label-md hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {isProcessing ? "Traitement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
