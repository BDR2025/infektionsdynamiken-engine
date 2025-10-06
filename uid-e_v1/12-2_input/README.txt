Input-Schicht

Die Input-Schicht umfasst alle Bestandteile, über die Lernende mit UID-Explore interagieren können. Hier werden Werte erfasst, verändert und an das System weitergegeben. Typische Elemente sind Regler, Eingabefelder oder Schaltflächen.

Die Aufgabe dieser Schicht ist es, Eingaben zuverlässig aufzunehmen und sie in ein standardisiertes Format zu überführen, das anschließend über den Event-Bus an die Basisschicht weitergeleitet wird. Dabei finden in der Input-Schicht selbst keine Berechnungen statt – sie ist ausschließlich für die Sammlung und Weitergabe von Interaktionen verantwortlich.

Durch diese klare Abgrenzung bleibt die Input-Schicht leichtgewichtig und flexibel. Sie kann für unterschiedliche Kontexte angepasst werden, etwa indem im Schulmodus nur wenige zentrale Regler sichtbar sind, während im Universitätsmodus der volle Umfang an Parametern zur Verfügung steht.