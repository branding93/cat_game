## Kater-Tamagotchi (David & Solom) – Architektur
  
Dieses Dokument beschreibt die technische Architektur der Web-App **„Kater-Tamagotchi“** (Vanilla HTML/CSS/JS, ohne externe Libraries).

### Überblick
  
Die App ist ein zeitbasiertes Dashboard-Simulationsspiel, das den Haushalt und die Pflegebedürfnisse zweier individueller Katzen simuliert. Sie läuft in einer asynchronen Game-Loop.

### Kernmechanik
- **Game Loop (setInterval)**: Simuliert den Zeitverlauf. Eine Ingame-Minute entspricht standardmäßig einer echten Sekunde (anpassbar durch Speed-Multiplikator).
- **Ressourcen-Management**: Globale Objekte (haushalt) verwalten Umgebungsfaktoren wie Wasser, Futterautomat und Sofa-Zustand.
- **Zustandsautomaten (Katzen)**: Jede Katze hat eigene Parameter (Energie, Hunger, Laune, Gewicht), die sich pro Tick (onTick) dynamisch verändern.

### Charakter-Spezifikationen
- **David (🐈)**:
- Geringer Energieverbrauch, schläft viel.
- Nimmt bei zu viel Futter und wenig Aktivität zu.
- Verweigert Nassfutter (Stimmungs-Malus).
- Spielpräferenz: Leere Kartons (Geringe Wahrscheinlichkeit für aktive Spiele).
- **Solom (🐈‍⬛)**:
- Hoher Energieverbrauch, besonders nachts (Nachtaktiv / Zoomies).
- Hohe Spielbereitschaft (besonders Laserpointer).
- Zerstört das Sofa nachts, wenn keine Schutzdecke aufliegt.

### Dateistruktur
/ (Projekt-Root)
├─ index.html                 # Markup & Dashboard-Grid-Struktur
├─ style.css                  # CSS Grid/Flexbox Layouts & Theming
├─ app.js                     # Spiellogik (Game Loop, State, Interaktionen)
├─ ARCHITECTURE.md            # Architektur-Doku
└─ PROMPT_TEMPLATE.md         # Prompt-Vorlage für zukünftige Prompts
