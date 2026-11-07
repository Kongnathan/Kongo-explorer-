import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  MessageTemplateId,
  SuggestedActionId,
  getMessageTemplate,
  getActionTemplate,
  filterOrTranslateResponse,
  matchIntentTemplate,
} from "./guideTemplates";

export interface ChatMessage {
  id: string;
  sender: "user" | "guide";
  text: string;
  templateId?: MessageTemplateId;
  suggestedAction?: {
    actionId?: SuggestedActionId;
    label: string;
    route: string;
    tourStepId?: string;
  } | null;
  timestamp: string;
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
  const { language, t } = useLanguage();
  const isEn = language === "en";

  const formatTimestamp = () => {
    return new Date().toLocaleTimeString(isEn ? "en-US" : "fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-welcome",
      sender: "guide",
      text: getMessageTemplate("welcome", language),
      templateId: "welcome",
      timestamp: formatTimestamp(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on changes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom();
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, messages, isLoading]);

  // Resolves the actual text to display for a message based on the active language context
  const getDisplayMessageText = (msg: ChatMessage): string => {
    if (msg.templateId) {
      return getMessageTemplate(msg.templateId, language);
    }
    return msg.text;
  };

  // Resolves the actual label to display for a suggested action based on active language
  const getDisplayActionLabel = (
    action: NonNullable<ChatMessage["suggestedAction"]>
  ): string => {
    if (action.actionId) {
      return getActionTemplate(action.actionId, language).label;
    }
    return action.label;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: queryText,
      timestamp: formatTimestamp(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        sender: m.sender,
        text: getDisplayMessageText(m),
      }));

      const res = await fetch("/api/guide-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          history: historyPayload,
          language,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      
      // Filter or translate response according to the active language
      const filtered = filterOrTranslateResponse(
        data.reply || "",
        queryText,
        language,
        data.actionTarget || data.suggestedAction?.tourStepId,
        data.suggestedAction?.label
      );

      const guideMsg: ChatMessage = {
        id: `guide-${Date.now()}`,
        sender: "guide",
        text: filtered.text,
        templateId: filtered.templateId,
        timestamp: formatTimestamp(),
        suggestedAction: filtered.suggestedAction || null,
      };

      setMessages((prev) => [...prev, guideMsg]);
    } catch (err) {
      console.warn("Guide chat network fallback triggered:", err);

      // Local fallback filtered strictly to the active language
      const filtered = filterOrTranslateResponse("", queryText, language);

      const fallbackMsg: ChatMessage = {
        id: `guide-err-${Date.now()}`,
        sender: "guide",
        text: filtered.text,
        templateId: filtered.templateId || "fallback_general",
        timestamp: formatTimestamp(),
        suggestedAction: filtered.suggestedAction || null,
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Background click-away dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/25 sm:bg-black/10 backdrop-blur-[1px] pointer-events-auto"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Floating Chat Widget anchored at bottom-right corner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-label={t.guideChat.ariaLabel}
            className="fixed bottom-24 right-3 sm:right-6 left-3 sm:left-auto w-auto sm:w-[410px] h-[520px] max-h-[calc(100dvh-120px)] bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-on-surface pointer-events-auto z-50 backdrop-blur-md"
          >
            {/* Header */}
            <header className="p-3.5 bg-surface-container-low/95 border-b border-outline-variant/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative w-10 h-10 rounded-2xl bg-emerald-700/15 border-2 border-emerald-500/40 overflow-hidden shadow-sm shrink-0 p-0.5">
                  <img
                    src="/guide-avatar.jpg"
                    alt={t.guideChat.mascotAlt}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-surface-container-lowest" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-sans text-body-md font-bold text-on-surface leading-tight">
                      {t.guideChat.headerTitle}
                    </h3>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-700/10 text-emerald-800 dark:text-emerald-300">
                      {t.guideChat.onlineStatus}
                    </span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant leading-tight">
                    {t.guideChat.headerSubtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    onClose();
                    onStartTour();
                  }}
                  className="px-2 py-1 rounded-xl border border-outline-variant/40 hover:bg-surface-container-high text-[11px] font-semibold text-on-surface-variant flex items-center gap-1 transition-colors cursor-pointer"
                  title={t.guideChat.startTourBtn}
                >
                  <span className="material-symbols-outlined text-[15px] text-emerald-600">tour</span>
                  <span className="hidden sm:inline">{t.guideChat.startTourBtn}</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                  aria-label={t.common.close}
                  title={t.common.close}
                >
                  <span className="material-symbols-outlined text-[20px]">expand_more</span>
                </button>
              </div>
            </header>

            {/* Messages List Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-body-sm">
              {messages.map((msg) => {
                const displayText = getDisplayMessageText(msg);
                return (
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
                      <p className="whitespace-pre-wrap">{displayText}</p>
                      {msg.suggestedAction && (
                        <div className="mt-3 pt-2.5 border-t border-outline-variant/30 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleActionClick(msg.suggestedAction!)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[15px]">near_me</span>
                            <span>{getDisplayActionLabel(msg.suggestedAction)}</span>
                          </button>
                          <span className="text-[10px] text-on-surface-variant font-mono">
                            {t.guideChat.showMe}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-on-surface-variant/70 mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}

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
                {t.guideChat.suggestionsTitle}
              </span>
              {t.guideChat.suggestedQuestions.map((question, idx) => (
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
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.guideChat.inputPlaceholder}
                  disabled={isLoading}
                  className="w-full bg-transparent border-none focus:outline-none text-body-sm text-on-surface placeholder:text-on-surface-variant/50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
                  aria-label={t.guideChat.send}
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </form>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
