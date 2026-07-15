import React, { useState } from "react";

interface Phrase {
  french: string;
  local: string;
  lang: "Lingala" | "Kikongo";
}

export default function LocalTipsView() {
  const [activeCategory, setActiveCategory] = useState<"culture" | "eco" | "prep" | "lang">("culture");

  const phrases: Phrase[] = [
    { french: "Bonjour (Comment ça va ?)", local: "Mbote (Sango nini ?)", lang: "Lingala" },
    { french: "Ça va bien", local: "Sango malamu", lang: "Lingala" },
    { french: "Merci beaucoup", local: "Melési mingi / Matondo mingi", lang: "Lingala" },
    { french: "S'il vous plaît", local: "S'il vous plaît / Tafadhali", lang: "Lingala" },
    { french: "Au revoir", local: "Tikala malamu (Restez bien)", lang: "Lingala" },
    { french: "Bonjour (à vous)", local: "Mbote na beno", lang: "Kikongo" },
    { french: "Merci beaucoup", local: "Matondo mingi", lang: "Kikongo" },
    { french: "Comment allez-vous ?", local: "Inki bansangu ?", lang: "Kikongo" },
    { french: "Tout va bien", local: "Bansangu yambote", lang: "Kikongo" },
    { french: "Eau", local: "Maza", lang: "Kikongo" }
  ];

  return (
    <div className="flex-1 pb-24 font-sans bg-background text-on-background animate-fade-in">
      {/* Stick Header */}
      <header className="w-full top-0 sticky z-40 bg-surface-container-low shadow-sm">
        <div className="flex items-center justify-between px-5 py-2 w-full max-w-7xl mx-auto h-16">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">gavel</span>
            <h1 className="font-sans text-headline-md font-bold text-primary">Conseils Locaux</h1>
          </div>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-mono font-bold uppercase">
            Guide éthique
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 pt-6 space-y-6">
        {/* Intro */}
        <section className="bg-gradient-to-br from-primary to-primary-container text-white p-6 rounded-3xl shadow-xl space-y-3 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[150px]">volunteer_activism</span>
          </div>
          <h2 className="font-sans text-headline-lg-mobile md:text-headline-md font-bold leading-tight">
            Voyager avec respect et bienveillance
          </h2>
          <p className="text-white/90 text-body-md leading-relaxed">
            La province du Kongo Central est une région d'une immense richesse culturelle, historique et écologique. 
            Ce guide vous aide à préparer votre aventure en phase avec les coutumes locales et la protection de cet écosystème exceptionnel.
          </p>
        </section>

        {/* Categories Tab Selector */}
        <div className="flex space-x-1 bg-surface-container p-1 rounded-2xl overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveCategory("culture")}
            className={`flex-1 py-3 px-4 rounded-xl font-sans text-label-md font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === "culture"
                ? "bg-primary text-white shadow-md"
                : "text-on-surface-variant hover:bg-surface-variant/50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">family_restroom</span>
            Coutumes
          </button>
          <button
            onClick={() => setActiveCategory("eco")}
            className={`flex-1 py-3 px-4 rounded-xl font-sans text-label-md font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === "eco"
                ? "bg-primary text-white shadow-md"
                : "text-on-surface-variant hover:bg-surface-variant/50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">eco</span>
            Éco-Geste
          </button>
          <button
            onClick={() => setActiveCategory("prep")}
            className={`flex-1 py-3 px-4 rounded-xl font-sans text-label-md font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === "prep"
                ? "bg-primary text-white shadow-md"
                : "text-on-surface-variant hover:bg-surface-variant/50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            Préparation
          </button>
          <button
            onClick={() => setActiveCategory("lang")}
            className={`flex-1 py-3 px-4 rounded-xl font-sans text-label-md font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === "lang"
                ? "bg-primary text-white shadow-md"
                : "text-on-surface-variant hover:bg-surface-variant/50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">translate</span>
            Lexique
          </button>
        </div>

        {/* Content Box */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-md min-h-[300px]">
          {activeCategory === "culture" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined text-primary text-2xl">menu_book</span>
                <h3 className="font-sans text-headline-md font-bold text-primary">Coutumes & Savoir-Vivre</h3>
              </div>
              <p className="text-on-surface-variant text-body-md leading-relaxed">
                Les traditions de l'Empire du Kongo et des cultures congolaises contemporaines accordent une place primordiale aux relations humaines, à l'hospitalité et au respect des aînés.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/25">
                  <h4 className="font-sans text-body-lg font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">photo_camera</span>
                    Photographie éthique
                  </h4>
                  <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
                    Demandez <strong>toujours l'autorisation</strong> avant de photographier quelqu'un, en particulier les enfants ou les anciens. Expliquez poliment votre intérêt pour leur culture.
                  </p>
                </div>
                
                <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/25">
                  <h4 className="font-sans text-body-lg font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">diversity_3</span>
                    Salutations chaleureuses
                  </h4>
                  <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
                    Prendre le temps de saluer est obligatoire. Un simple <em>"Mbote"</em> accompagné d'un sourire sincère ouvre instantanément les cœurs et facilite l'échange.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/25">
                  <h4 className="font-sans text-body-lg font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">gavel</span>
                    Sagesse des Anciens
                  </h4>
                  <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
                    Dans les villages près des parcs et cascades, le chef coutumier ou les anciens incarnent la mémoire de la terre. Écoutez attentivement leurs récits, ils regorgent d'enseignements.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/25">
                  <h4 className="font-sans text-body-lg font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">local_activity</span>
                    Tenue vestimentaire
                  </h4>
                  <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                    Optez pour des vêtements pudiques et sobres, particulièrement lors de la visite d'églises historiques (comme à Boma) ou de réunions dans les communautés locales.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeCategory === "eco" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined text-primary text-2xl">nature_people</span>
                <h3 className="font-sans text-headline-md font-bold text-primary">Éco-Responsabilité au Kongo Central</h3>
              </div>
              <p className="text-on-surface-variant text-body-md leading-relaxed">
                Le Kongo Central, situé au sein du bassin du Congo (le deuxième poumon écologique de la Terre après l'Amazone), abrite des mangroves et forêts uniques. Sa protection dépend de nos gestes quotidiens en tant que voyageurs engagés.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <span className="material-symbols-outlined text-emerald-600 text-3xl">delete_sweep</span>
                  <div>
                    <h4 className="font-sans text-body-lg font-bold text-emerald-800">Politique Zéro Déchet</h4>
                    <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
                      Aucune infrastructure de recyclage n'existe dans les parcs isolés. Emportez toujours un petit sac pour ramasser vos déchets (plastiques, piles, emballages) et ramenez-les vers les centres urbains majeurs pour traitement.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <span className="material-symbols-outlined text-emerald-600 text-3xl">pets</span>
                  <div>
                    <h4 className="font-sans text-body-lg font-bold text-emerald-800">Préservation des Espèces</h4>
                    <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
                      Ne touchez jamais aux animaux sauvages, ne nourrissez pas les bonobos ou singes dans les réserves. Conservez les distances de sécurité (10m minimum) pour éviter la transmission croisée de maladies.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <span className="material-symbols-outlined text-emerald-600 text-3xl">water_drop</span>
                  <div>
                    <h4 className="font-sans text-body-lg font-bold text-emerald-800">Protection des Eaux</h4>
                    <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
                      Utilisez exclusivement des savons biodégradables lors de vos campements près de rivières comme l'Inkisi ou le fleuve Congo pour ne pas contaminer la ressource potable des communautés en aval.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeCategory === "prep" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined text-primary text-2xl">work_history</span>
                <h3 className="font-sans text-headline-md font-bold text-primary">Préparation administrative & physique</h3>
              </div>
              <p className="text-on-surface-variant text-body-md leading-relaxed">
                Une bonne préparation physique et matérielle est la clé d'un séjour sûr et mémorable dans les régions tropicales.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface-container p-4 rounded-2xl text-center space-y-2 border border-outline-variant/15">
                  <span className="material-symbols-outlined text-primary text-3xl">vaccines</span>
                  <h4 className="font-sans text-body-md font-bold text-primary">Santé & Vaccins</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Vaccination <strong>Fièvre Jaune</strong> rigoureusement obligatoire pour l'entrée sur le territoire. Traitement antipaludéen fortement recommandé.
                  </p>
                </div>

                <div className="bg-surface-container p-4 rounded-2xl text-center space-y-2 border border-outline-variant/15">
                  <span className="material-symbols-outlined text-primary text-3xl">assignment_turned_in</span>
                  <h4 className="font-sans text-body-md font-bold text-primary">Laisser-passer</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Certains parcs ou zones frontalières nécessitent des permis d'accès ou des autorisations écrites des parcs de l'ICCN. Anticipez vos demandes.
                  </p>
                </div>

                <div className="bg-surface-container p-4 rounded-2xl text-center space-y-2 border border-outline-variant/15">
                  <span className="material-symbols-outlined text-primary text-3xl">luggage</span>
                  <h4 className="font-sans text-body-md font-bold text-primary">Bagages essentiels</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Vêtements longs en coton léger (protection insectes), gourde filtrante, imperméable robuste, et batterie externe solaire (zones non raccordées).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeCategory === "lang" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined text-primary text-2xl">record_voice_over</span>
                <h3 className="font-sans text-headline-md font-bold text-primary">Petit lexique d'accueil</h3>
              </div>
              <p className="text-on-surface-variant text-body-md leading-relaxed">
                Parler même quelques mots de la langue locale témoigne d'un immense respect pour vos hôtes congolais. Le Lingala est parlé majoritairement à Kinshasa et le long du fleuve, tandis que le Kikongo est la langue historique du Kongo Central.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant">
                      <th className="py-2.5 px-3 font-sans text-body-md font-bold text-primary">Français</th>
                      <th className="py-2.5 px-3 font-sans text-body-md font-bold text-secondary">Traduction locale</th>
                      <th className="py-2.5 px-3 font-mono text-xs text-on-surface-variant">Langue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phrases.map((phrase, idx) => (
                      <tr key={idx} className="border-b border-outline-variant/20 hover:bg-surface-variant/20">
                        <td className="py-2 px-3 font-sans text-sm text-on-surface">{phrase.french}</td>
                        <td className="py-2 px-3 font-sans text-sm text-primary font-bold">{phrase.local}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            phrase.lang === "Lingala" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {phrase.lang}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
