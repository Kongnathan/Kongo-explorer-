import React, { useState } from "react";
import { KongoNotification, Location } from "../types";

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: KongoNotification[];
  onMarkAllAsRead: () => void;
  onToggleRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onAddNotification: (notif: KongoNotification) => void;
  onSelectLocation: (locationId: string) => void;
  locations: Location[];
}

export default function NotificationCenterModal({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onToggleRead,
  onDeleteNotification,
  onAddNotification,
  onSelectLocation,
  locations,
}: NotificationCenterModalProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "SECURITY" | "UPDATES" | "UNREAD">("ALL");
  const [showAddForm, setShowAddForm] = useState(false);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<string>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );

  // New notification form states
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newType, setNewType] = useState<"SECURITY_ALERT" | "SITE_UPDATE" | "SAFETY_TIPS" | "INFO">("SECURITY_ALERT");
  const [newSeverity, setNewSeverity] = useState<"CRITICAL" | "WARNING" | "INFO">("WARNING");
  const [newSource, setNewSource] = useState("Information Citoyenne / Alerte Route");
  const [selectedLocId, setSelectedLocId] = useState("");

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const securityCount = notifications.filter((n) => n.type === "SECURITY_ALERT" || n.severity === "CRITICAL").length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "UNREAD") return !n.read;
    if (activeTab === "SECURITY") return n.type === "SECURITY_ALERT" || n.severity === "CRITICAL" || n.type === "SAFETY_TIPS";
    if (activeTab === "UPDATES") return n.type === "SITE_UPDATE" || n.type === "INFO";
    return true;
  });

  const handleRequestPushPermission = async () => {
    if (!("Notification" in window)) {
      alert("Votre navigateur ne prend pas en charge les notifications push.");
      return;
    }
    try {
      const res = await Notification.requestPermission();
      setPushPermissionStatus(res);
      if (res === "granted") {
        new Notification("Kongo Central Explorer", {
          body: "Notifications de sécurité et mises à jour activées !",
          icon: "/icon.svg",
        });
      }
    } catch (err) {
      console.error("Erreur lors de la demande de permission push:", err);
    }
  };

  const handleCreateNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) {
      alert("Veuillez renseigner un titre et un message d'alerte.");
      return;
    }

    const matchedLocation = locations.find((l) => l.id === selectedLocId);

    const createdNotif: KongoNotification = {
      id: `notif-${Date.now()}`,
      title: newTitle.trim(),
      message: newMessage.trim(),
      type: newType,
      severity: newSeverity,
      source: newSource.trim() || "Alerte Sécurité Kongo Central",
      locationId: matchedLocation?.id,
      locationTitle: matchedLocation?.title,
      timestamp: "À l'instant",
      read: false,
    };

    onAddNotification(createdNotif);

    // Optional native notification trigger
    if (pushPermissionStatus === "granted") {
      new Notification(createdNotif.title, {
        body: createdNotif.message,
        icon: "/icon.svg",
      });
    }

    // Reset form
    setNewTitle("");
    setNewMessage("");
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface border border-outline-variant/30 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* MODAL HEADER */}
        <div className="bg-surface-container p-4 border-b border-outline-variant/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 relative shadow-sm">
              <span className="material-symbols-outlined text-[24px]">notifications_active</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white font-mono text-[10px] font-bold flex items-center justify-center border-2 border-surface animate-bounce">
                  {unreadCount}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans text-base font-bold text-on-surface">
                  Centre d'Alertes & Notifications
                </h3>
                <span className="bg-primary/10 text-primary text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                  Kongo Central
                </span>
              </div>
              <p className="text-outline text-xs">
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""} • {securityCount} alerte{securityCount > 1 ? "s" : ""} de sécurité
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface flex items-center justify-center transition-all cursor-pointer border border-outline-variant/30"
            title="Fermer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* PUSH NOTIFICATION BANNER & ACTIONS */}
        <div className="bg-surface-container-lowest px-4 py-3 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRequestPushPermission}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer border ${
                pushPermissionStatus === "granted"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                  : "bg-primary/10 text-primary hover:bg-primary hover:text-white border-primary/20"
              }`}
              title="Activer les alertes push du navigateur"
            >
              <span className="material-symbols-outlined text-[16px]">
                {pushPermissionStatus === "granted" ? "notifications_active" : "notification_add"}
              </span>
              <span>
                {pushPermissionStatus === "granted" ? "Alertes Push Actives" : "Activer les Alertes Push"}
              </span>
            </button>

            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-outline hover:text-on-surface bg-surface-container hover:bg-surface-variant border border-outline-variant/30 transition-all cursor-pointer flex items-center gap-1"
                title="Tout marquer comme lu"
              >
                <span className="material-symbols-outlined text-[16px]">done_all</span>
                <span>Tout lire</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
              showAddForm
                ? "bg-surface-variant text-on-surface border-outline-variant"
                : "bg-primary text-white border-primary shadow-sm hover:brightness-110"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {showAddForm ? "remove" : "add_alert"}
            </span>
            <span>{showAddForm ? "Annuler" : "Signaler une alerte"}</span>
          </button>
        </div>

        {/* NEW ALERT FORM COLLAPSIBLE */}
        {showAddForm && (
          <form
            onSubmit={handleCreateNotification}
            className="bg-amber-500/5 p-4 border-b border-amber-500/20 space-y-3 shrink-0 animate-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">campaign</span>
              <span>Publier une Alerte de Sécurité ou Mise à Jour de Lieu</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-outline mb-1">Type d'Information</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans text-on-surface focus:ring-2 focus:ring-primary"
                >
                  <option value="SECURITY_ALERT">⚠️ Alerte Sécurité / Danger Route</option>
                  <option value="SITE_UPDATE">🏛️ Mise à jour d'un Lieu de Visite</option>
                  <option value="SAFETY_TIPS">🌊 Consigne Météo / Prudence</option>
                  <option value="INFO">💡 Information Touristique</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-outline mb-1">Niveau d'Urgence</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as any)}
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans text-on-surface focus:ring-2 focus:ring-primary"
                >
                  <option value="CRITICAL">🔴 Critique (Rouge / Danger immédiat)</option>
                  <option value="WARNING">🟠 Attention (Orange / Prudence)</option>
                  <option value="INFO">🔵 Information (Bleu / Neutre)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-outline mb-1">Titre de l'Alerte</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Fortes pluies sur le col de Mbanza-Ngungu"
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans text-on-surface focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-outline mb-1">Lieu Concerné (Optionnel)</label>
                <select
                  value={selectedLocId}
                  onChange={(e) => setSelectedLocId(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans text-on-surface focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Aucun lieu spécifique --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.title} ({loc.locationName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-outline mb-1">Description Détaillée</label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Précisez les consignes, l'état de la chaussée ou les conditions d'accès..."
                rows={2}
                className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans text-on-surface focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <input
                type="text"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                placeholder="Source (ex: Éco-gardes ICCN, Protection Civile)"
                className="bg-surface border border-outline-variant/40 rounded-xl px-3 py-1.5 text-xs font-sans text-on-surface w-2/3"
              />

              <button
                type="submit"
                className="bg-primary text-white font-sans text-xs font-bold px-4 py-2 rounded-xl shadow-md hover:brightness-110 cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>Diffuser l'Alerte</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB FILTER CHIPS */}
        <div className="bg-surface-container-low px-4 py-2.5 border-b border-outline-variant/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "ALL"
                ? "bg-primary text-white shadow-sm"
                : "bg-surface-container text-outline hover:text-on-surface"
            }`}
          >
            Toutes ({notifications.length})
          </button>

          <button
            onClick={() => setActiveTab("SECURITY")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeTab === "SECURITY"
                ? "bg-red-600 text-white shadow-sm"
                : "bg-surface-container text-outline hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">warning</span>
            <span>Alertes Sécurité ({securityCount})</span>
          </button>

          <button
            onClick={() => setActiveTab("UPDATES")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeTab === "UPDATES"
                ? "bg-primary text-white shadow-sm"
                : "bg-surface-container text-outline hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">landscape</span>
            <span>Mises à Jour Sites</span>
          </button>

          <button
            onClick={() => setActiveTab("UNREAD")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeTab === "UNREAD"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-surface-container text-outline hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">mark_email_unread</span>
            <span>Non Lues ({unreadCount})</span>
          </button>
        </div>

        {/* NOTIFICATIONS LIST */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-outline space-y-2">
              <span className="material-symbols-outlined text-4xl opacity-40">notifications_off</span>
              <p className="text-xs font-sans">Aucune notification dans cette catégorie.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isCritical = notif.severity === "CRITICAL";
              const isWarning = notif.severity === "WARNING";

              return (
                <div
                  key={notif.id}
                  className={`rounded-2xl p-4 border transition-all shadow-sm relative overflow-hidden ${
                    !notif.read
                      ? isCritical
                        ? "bg-red-500/10 border-red-500/40"
                        : isWarning
                        ? "bg-amber-500/10 border-amber-500/40"
                        : "bg-primary/10 border-primary/40"
                      : "bg-surface border-outline-variant/30 opacity-85"
                  }`}
                >
                  {/* Left severity indicator stripe */}
                  <div
                    className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                      isCritical ? "bg-red-600" : isWarning ? "bg-amber-500" : "bg-sky-500"
                    }`}
                  />

                  <div className="pl-2 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Type Badge */}
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            isCritical
                              ? "bg-red-600 text-white"
                              : isWarning
                              ? "bg-amber-500/20 text-amber-800 dark:text-amber-200"
                              : "bg-sky-500/20 text-sky-800 dark:text-sky-200"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {isCritical ? "warning" : isWarning ? "info" : "nature_people"}
                          </span>
                          {notif.type === "SECURITY_ALERT"
                            ? "ALERTE SÉCURITÉ"
                            : notif.type === "SITE_UPDATE"
                            ? "MISE À JOUR LIEU"
                            : notif.type === "SAFETY_TIPS"
                            ? "CONSIGNE MÉTÉO"
                            : "INFORMATION"}
                        </span>

                        <span className="text-[10px] font-mono text-outline">{notif.timestamp}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onToggleRead(notif.id)}
                          className="p-1 text-outline hover:text-on-surface rounded-lg transition-colors"
                          title={notif.read ? "Marquer non lu" : "Marquer comme lu"}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {notif.read ? "mark_email_read" : "mark_email_unread"}
                          </span>
                        </button>

                        <button
                          onClick={() => onDeleteNotification(notif.id)}
                          className="p-1 text-outline hover:text-red-500 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>

                    <h4 className="font-sans text-sm font-bold text-on-surface leading-snug">
                      {notif.title}
                    </h4>

                    <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/15 text-[11px]">
                      {notif.source && (
                        <span className="font-mono text-[10px] text-outline flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">verified</span>
                          Source : {notif.source}
                        </span>
                      )}

                      {notif.locationId && (
                        <button
                          onClick={() => {
                            onSelectLocation(notif.locationId!);
                            onClose();
                          }}
                          className="font-sans text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer ml-auto"
                        >
                          <span>Voir la fiche du site ({notif.locationTitle || "Ouvrir"})</span>
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="bg-surface-container p-3 border-t border-outline-variant/30 flex items-center justify-between text-xs font-sans shrink-0">
          <span className="text-outline font-mono text-[11px]">Système d'Alerte Kongo Central</span>
          <button
            onClick={onClose}
            className="bg-primary text-white font-bold px-4 py-2 rounded-xl cursor-pointer hover:brightness-110"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
