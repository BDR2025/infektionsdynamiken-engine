Die Architektur von UID-Explore

UID-Explore ist das Herzstück des Projektes und deutlich komplexer aufgebaut als UID-Intro. Während Intro eine festgelegte Abfolge zeigt, eröffnet Explore den Lernenden die Möglichkeit, Modelle aktiv zu verändern und eigene Szenarien zu erkunden.

Die Architektur gliedert sich in vier Schichten:

Input-Schicht
Diese Ebene umfasst die Schnittstellen, über die Lernende mit dem System interagieren. Regler, Eingabefelder und Buttons nehmen Eingaben auf und leiten sie in standardisierter Form über den Event-Bus weiter. Eigene Berechnungen finden hier nicht statt – die Aufgabe ist allein die Erfassung und Weitergabe von Interaktionen.

Basis-Schicht
Hier arbeiten Director, Engine und der Event-Bus zusammen. Sie stellen sicher, dass Eingaben konsistent verarbeitet werden, die numerischen Berechnungen zuverlässig ablaufen und Ergebnisse in einheitlicher Form für die weiteren Module bereitgestellt werden.

Darstellung
Diese Ebene macht die Ergebnisse für Lernende sichtbar. Sie bereitet die gelieferten Daten in Form von Kurven, verdichteten Kennzahlen, symbolischen Overlays oder mathematischen Gleichungen auf. Ziel ist es, komplexe Zusammenhänge anschaulich und verständlich darzustellen, ohne eigene Berechnungen vorzunehmen.

Support-Schicht
Darunter fallen alle ergänzenden Bestandteile, die den Betrieb und die Nutzung von UID-Explore unterstützen, ohne direkt in die Verarbeitung oder Darstellung einzugreifen. Dazu gehören Stylesheets, Sprachdateien, externe Bibliotheken oder Demoinstanzen. Sie sorgen für Gestaltung, Mehrsprachigkeit und technische Infrastruktur.

Durch diese klare Vierteilung bleibt das System für Lernende leicht zugänglich und für Entwickler übersichtlich. Wer mit Explore arbeitet, erlebt eine einfache und anschauliche Umgebung, während auf der technischen Ebene eine modulare Architektur bereitsteht, die jederzeit erweitert und gepflegt werden kann. Alle Bestandteile von UID-Explore sind in diesem Repository öffentlich zugänglich und frei verfügbar.