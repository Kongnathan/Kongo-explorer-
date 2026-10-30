import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GUIDE_SUGGESTED_QUESTIONS } from "../../data/guideKnowledgeBase";

interface ChatMessage {
  id: string;
  sender: "user" | "guide";
  text: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    route: string;
    tourStepId?: string;
  } | null;
}

interface GuideChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
  onNavigateTo: (route: string, tourStepIndex?: number) => void;
}

export default function GuideChatModal({
  isOpen,
  onClose,
  onStartTour,
  onNavigateTo,
}: GuideChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-welcome",
      sender: "guide",
      text: "Bonjour et bienvenue sur Kongo Explorer ! Je suis Guide Kongo, votre assistant personnel. Je suis là pour vous aider à comprendre chaque option du site et vous guider dans votre découverte. Que souhaitez-vous savoir ?",
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 150);
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: queryText,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await fetch("/api/guide-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const guideMsg: ChatMessage = {
        id: `guide-${Date.now()}`,
        sender: "guide",
        text: data.reply || "Je suis à votre écoute pour vous aider à explorer le Kongo Central.",
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        suggestedAction: data.suggestedAction || null,
      };

      setMessages((prev) => [...prev, guideMsg]);
    } catch (err) {
      console.error("Guide chat error:", err);
      // Smart contextual fallback if network or fetch is interrupted
      const q = queryText.toLowerCase();
      let fallbackText = "Je suis là pour vous aider ! Vous pouvez explorer la carte, découvrir nos circuits thématiques ou consulter les bons plans dans Infos Tourisme.";
      let fallbackAction: ChatMessage["suggestedAction"] = {
        label: "Lancer la visite guidée",
        route: "/",
        tourStepId: "start-tour",
      };

      if (q.includes("publi") || q.includes("proposer") || q.includes("info") || q.includes("article") || q.includes("post")) {
        fallbackText = "Pour publier une info touristique, rendez-vous dans la rubrique 'Infos Tourisme' et cliquez sur '+ Publier une info'. Toute publication est systématiquement vérifiée par un administrateur avant d'apparaître en ligne. Souhaitez-vous que je vous montre la rubrique ?";
        fallbackAction = {
          label: "Voir Infos Tourisme",
          route: "/infos-tourisme",
          tourStepId: "step-infos",
        };
      } else if (q.includes("carte") || q.includes("map") || q.includes("itineraire") || q.includes("position") || q.includes("lieu")) {
        fallbackText = "La carte interactive du Kongo Central vous permet de situer chaque merveille (Zongo, Boma, Matadi, Muanda, Kisantu...) et de calculer vos trajets. Voulez-vous ouvrir la carte ?";
        fallbackAction = {
          label: "Ouvrir la carte",
          route: "/carte",
          tourStepId: "step-carte",
        };
      } else if (q.includes("circuit") || q.includes("trajet") || q.includes("route")) {
        fallbackText = "Nos circuits touristiques regroupent les plus beaux parcours pas à pas avec les durées et le type de véhicule conseillé (voiture ou 4x4). Voulez-vous voir les circuits ?";
        fallbackAction = {
          label: "Découvrir les circuits",
          route: "/circuits",
          tourStepId: "step-circuits",
        };
      } else if (q.includes("carnet") || q.includes("hors ligne") || q.includes("offline") || q.includes("sauvegard")) {
        fallbackText = "Vous pouvez enregistrer vos fiches favorites dans votre carnet pour les consulter même sans aucune connexion Internet. Voulez-vous voir votre carnet ?";
        fallbackAction = {
          label: "Voir mon carnet",
          route: "/carnet",
          tourStepId: "step-carnet",
        };
      }

      const fallbackMsg: ChatMessage = {
        id: `guide-err-${Date.now()}`,
        sender: "guide",
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        suggestedAction: fallbackAction,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: NonNullable<ChatMessage["suggestedAction"]>) => {
    let stepIdx: number | undefined = undefined;
    if (action.tourStepId === "step-search") stepIdx = 1;
    else if (action.tourStepId === "step-carte") stepIdx = 2;
    else if (action.tourStepId === "step-circuits") stepIdx = 3;
    else if (action.tourStepId === "step-infos") stepIdx = 4;
    else if (action.tourStepId === "step-carnet") stepIdx = 5;
    else if (action.tourStepId === "step-conseils") stepIdx = 6;
    else if (action.tourStepId === "start-tour") stepIdx = 0;

    onClose();
    onNavigateTo(action.route, stepIdx);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Discussion avec Guide Kongo"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative w-full max-w-xl h-[85vh] max-h-[680px] bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-on-surface"
      >
        {/* Header */}
        <header className="p-4 bg-surface-container-low/95 border-b border-outline-variant/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl bg-emerald-700/15 border border-emerald-600/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px] text-emerald-700 dark:text-emerald-400">
                smart_toy
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface-container-lowest" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans text-body-md font-bold text-on-surface leading-tight">
                  Guide Kongo
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-700/10 text-emerald-800 dark:text-emerald-300">
                  Assistant IA
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Votre guide d'accueil et d'exploration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onClose();
                onStartTour();
              }}
              className="px-2.5 py-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container-high text-xs font-semibold text-on-surface-variant flex items-center gap-1 transition-colors cursor-pointer"
              title="Relancer le tutoriel pas à pas"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600">tour</span>
              <span className="hidden sm:inline">Visite guidée</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              aria-label="Fermer le chat"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </header>

        {/* Messages List Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-body-sm">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-emerald-700 text-white rounded-br-xs"
                    : "bg-surface-container-high text-on-surface border border-outline-variant/20 rounded-bl-xs"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                {msg.suggestedAction && (
                  <div className="mt-3 pt-2.5 border-t border-outline-variant/30 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleActionClick(msg.suggestedAction!)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[15px]">near_me</span>
                      <span>{msg.suggestedAction.label}</span>
                    </button>
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      Me montrer
                    </span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-on-surface-variant/70 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-surface-container-high rounded-2xl rounded-bl-xs w-28 border border-outline-variant/20">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Questions */}
        <div className="px-4 py-2 bg-surface-container-low/50 border-t border-outline-variant/15 flex items-center gap-2 overflow-x-auto hide-scrollbar shrink-0">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider shrink-0 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-emerald-600">lightbulb</span>
            Suggestions :
          </span>
          {GUIDE_SUGGESTED_QUESTIONS.map((question, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(question)}
              disabled={isLoading}
              className="text-[11px] font-medium bg-surface-container-highest hover:bg-emerald-700/10 text-on-surface border border-outline-variant/30 hover:border-emerald-600/40 rounded-full px-3 py-1.5 whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>

        {/* Message Input Bar */}
        <footer className="p-3 bg-surface-container-low border-t border-outline-variant/20 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-surface-container-highest rounded-2xl px-3.5 py-2 border border-outline-variant/30 focus-within:ring-2 focus-within:ring-emerald-600 transition-all"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez une question sur Kongo Explorer..."
              disabled={isLoading}
              className="w-full bg-transparent border-none focus:outline-none text-body-sm text-on-surface placeholder:text-on-surface-variant/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
              aria-label="Envoyer"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>
        </footer>
      </motion.div>
    </div>
  );
}
