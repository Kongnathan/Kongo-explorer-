import React, { useState } from "react";
import { CommunityReport, Location } from "../types";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: Location | null;
  locations: Location[];
  onSubmitReport: (report: CommunityReport) => void;
}

export default function ReportModal({
  isOpen,
  onClose,
  location,
  locations,
  onSubmitReport
}: ReportModalProps) {
  const [selectedLocId, setSelectedLocId] = useState<string>(location?.id || locations[0]?.id || "");
  const [authorName, setAuthorName] = useState("");
  const [reportType, setReportType] = useState<CommunityReport["reportType"]>("ROUTE_CONDITION");
  const [comment, setComment] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const activeLoc = locations.find(l => l.id === selectedLocId) || location || locations[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const newReport: CommunityReport = {
      id: `report-${Date.now()}`,
      locationId: activeLoc?.id || "general",
      locationTitle: activeLoc?.title || "Kongo-Central General",
      authorName: authorName.trim() || "Visiteur Éco-Garde",
      reportType,
      comment: comment.trim(),
      date: new Date().toLocaleDateString("fr-FR"),
      status: "VERIFIED"
    };

    onSubmitReport(newReport);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setComment("");
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="bg-primary text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[22px]">report_problem</span>
            <div>
              <h3 className="font-sans font-bold text-body-md leading-tight">
                Signaler une Modification
              </h3>
              <p className="text-white/80 text-[11px] font-sans">
                Aidez la communauté à garder les routes & infos à jour
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center animate-bounce">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h4 className="font-sans font-bold text-body-lg text-on-surface">
              Merci pour votre contribution !
            </h4>
            <p className="text-xs text-outline font-sans">
              Votre signalement sur l'état de la route / du site a été enregistré.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Target Location Selection */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-outline uppercase mb-1">
                Destination Concernée
              </label>
              <select
                value={selectedLocId}
                onChange={(e) => setSelectedLocId(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.title} ({loc.locationName})
                  </option>
                ))}
              </select>
            </div>

            {/* Report Type */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-outline uppercase mb-1">
                Nature de l'Information
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReportType("ROUTE_CONDITION")}
                  className={`p-2.5 rounded-xl border text-xs font-sans font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    reportType === "ROUTE_CONDITION"
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-surface-container border-outline-variant/30 text-on-surface hover:border-outline"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">add_road</span>
                  <span>État de la route</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType("FEE_UPDATE")}
                  className={`p-2.5 rounded-xl border text-xs font-sans font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    reportType === "FEE_UPDATE"
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-surface-container border-outline-variant/30 text-on-surface hover:border-outline"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">payments</span>
                  <span>Tarif / Horaire</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType("GUIDE_INFO")}
                  className={`p-2.5 rounded-xl border text-xs font-sans font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    reportType === "GUIDE_INFO"
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-surface-container border-outline-variant/30 text-on-surface hover:border-outline"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">person_pin</span>
                  <span>Guide / Contact</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType("GENERAL")}
                  className={`p-2.5 rounded-xl border text-xs font-sans font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    reportType === "GENERAL"
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-surface-container border-outline-variant/30 text-on-surface hover:border-outline"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  <span>Autre remarque</span>
                </button>
              </div>
            </div>

            {/* Author Name */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-outline uppercase mb-1">
                Votre Nom ou Pseudo (Optionnel)
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ex. Christian K. (Touriste à Matadi)"
                className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Detailed Comment */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-outline uppercase mb-1">
                Détails du Signalement *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                rows={3}
                placeholder="Ex. Piste de Zongo détrempée par les pluies hier, véhicule 4x4 obligatoire. Tarif guide local révisé à $10."
                className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-sans font-bold rounded-xl cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!comment.trim()}
                className="px-5 py-2 bg-primary hover:bg-primary-container text-white text-xs font-sans font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>Envoyer le Signalement</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
