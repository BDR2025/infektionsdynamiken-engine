Basis-Schicht

Die Basis-Schicht von UID-Explore ist vollständig als ESM-Struktur aufgebaut (ESM bedeutet EcmaScript Modules und bezeichnet die moderne Art, wie JavaScript-Dateien sauber importiert und exportiert werden). Sie bildet das Fundament der Engine und sorgt dafür, dass Eingaben, Normalisierung, Berechnung und Kommunikation in klar getrennten Modulen ablaufen. Diese Gliederung macht den Kern verständlich, erweiterbar und zuverlässig.

Die fünf zentralen Module sind:

index.js
Der Barrel-Einstiegspunkt. Er bündelt die wichtigsten Exporte aus der Basis-Schicht und macht Director und Bus nach außen sichtbar.

bus.js
Der Event-Bus verteilt Ereignisse im System und spiegelt sie in den DOM, sodass Eingaben, Berechnungen und Darstellungen entkoppelt bleiben und leicht debuggt werden können.

schema.js
Das Schema definiert gültige Parameter, prüft Eingaben, setzt Grenzen und sorgt dafür, dass verbundene Werte wie R0, Beta, Gamma oder die infektiöse Dauer konsistent bleiben.

engine.js
Die Engine berechnet die Dynamik der Modelle. Sie setzt Gleichungen wie SIR, SEIR, SIRD oder SIRV mit Verfahren wie Euler, Heun oder Runge-Kutta um und liefert Zeitreihen für die Darstellung.

uid.js
Der Director steuert den Ablauf. Er nimmt Eingaben entgegen, nutzt das Schema zur Prüfung, ruft die Engine auf und verteilt die Ergebnisse über den Bus.