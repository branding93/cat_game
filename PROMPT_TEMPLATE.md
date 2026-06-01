# PROMPT_TEMPLATE – stabile KI-Änderungen (Kater-Tamagotchi)

## Harte Regeln
1. **Nur die geforderten Änderungen durchführen.**
2. **Vanilla Stack bewahren:** Nur Vanilla HTML/CSS/JS nutzen. Keine Frameworks (React, Vue) oder Build-Tools einführen.
3. **Zentrale Logik nicht brechen:** Das `game`-Objekt (`loopId`, `speed`) und die globale `updateUI()` Funktion sind die Grundpfeiler. Sie dürfen nicht architektonisch umgebaut werden, es sei denn explizit verlangt.
4. **Individuelle Charakter-Eigenschaften beibehalten:** Davids Abneigung gegen Nassfutter und Soloms Nachtaktivität dürfen durch allgemeine Code-Vereinfachungen nicht verloren gehen.
5. **Keine stillen Fehler im Game-Loop:** Wenn Berechnungen hinzugefügt werden, müssen diese performant in `onTick()` laufen.

## Regression-Checkliste
- Zeitsteuerung (Pause, Normal, Schnell) funktioniert nahtlos und stoppt / startet das Intervall sauber.
- Der Futterautomat triggert korrekt in den definierten Stundenintervallen (`onHourChange`).
- Balken (Progress-Tags) überschreiten nicht ihr Maximum (100) oder fallen unter 0.
- Interaktionen spiegeln sich direkt in der UI (`updateUI` Aufruf) und im Log (`#log`) wider.
- Das spezifische CSS-Theming (Farben `--david`, `--solom`) bleibt intakt.