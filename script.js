const CSV_URL = "daten.csv";

function parseDartsCSV(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const spielerListe = [];
    
    let aktuellerSpieler = null;

    lines.forEach(line => {
        // Ignoriere die Einleitungstexte aus der Excel/CSV
        if (line.startsWith('"') || line.includes("darstellung des aufbaus") || line.includes("gewünschten Spielerkarten")) return;

        // Wenn die Zeile kein Komma enthält, ist es ein Spielername
        if (!line.includes(',')) {
            if (aktuellerSpieler) {
                // Falls der vorherige Spieler zur Mannschaft 3 gehört, speichern
                if (String(aktuellerSpieler.mannschaft) === "3") {
                    spielerListe.push(aktuellerSpieler);
                }
            }
            // Neuen Spieler anlegen
            aktuellerSpieler = {
                name: line.replace(/"/g, ''),
                mannschaft: "",
                matches: 0,
                siege: 0,
                niederlagen: 0,
                legsGew: 0,
                legsVerl: 0,
                avg: 0.0
            };
        } else {
            // Zeile aufteilen in Label und Wert
            const parts = line.split(',');
            const label = parts[0].trim().toLowerCase();
            const value = parts[1] ? parts[1].trim().replace(/"/g, '') : "";

            if (aktuellerSpieler) {
                if (label === "mannschaft") aktuellerSpieler.mannschaft = value;
                if (label.includes("gesamt")) aktuellerSpieler.matches = parseInt(value) || 0;
                if (label === "match gew") aktuellerSpieler.siege = parseInt(value) || 0;
                if (label === "match verl") aktuellerSpieler.niederlagen = parseInt(value) || 0;
                if (label === "legs gew") aktuellerSpieler.legsGew = parseInt(value) || 0;
                if (label === "legs verl") aktuellerSpieler.legsVerl = parseInt(value) || 0;
                if (label === "schnitt avg") aktuellerSpieler.avg = parseFloat(value.replace(',', '.')) || 0.0;
            }
        }
    });

    // Den letzten Spieler der Schleife prüfen und hinzufügen
    if (aktuellerSpieler && String(aktuellerSpieler.mannschaft) === "3") {
        spielerListe.push(aktuellerSpieler);
    }

    return spielerListe;
}

function generiereKarten(spielerDaten) {
    const wrapper = document.getElementById('app-wrapper');
    if (!wrapper) return;

    wrapper.innerHTML = ''; 

    if (spielerDaten.length === 0) {
        wrapper.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#9ca3af;">Keine Spieler für Mannschaft 3 in der CSV gefunden.</p>';
        return;
    }

    spielerDaten.forEach(spieler => {
        const winQuote = spieler.matches > 0 ? Math.round((spieler.siege / spieler.matches) * 100) : 0;
        const totalLegs = spieler.legsGew + spieler.legsVerl;
        const legQuote = totalLegs > 0 ? Math.round((spieler.legsGew / totalLegs) * 100) : 0;

        const card = document.createElement('div');
        card.className = 'player-card';

        card.innerHTML = `
            <div>
                <h2>${spieler.name}</h2>
                <div class="status">TV Kapellen 3</div>
            </div>
            
            <div class="stats-grid">
                <div>
                    <div class="label">3-Dart-Avg</div>
                    <div class="value-avg-box">${spieler.avg.toFixed(2)}</div>
                </div>
                <div>
                    <div class="label">Matches (S/N)</div>
                    <div class="value-big">
                        <span class="bilanz-gewonnen">${spieler.siege}</span> / 
                        <span class="bilanz-verloren">${spieler.niederlagen}</span>
                    </div>
                </div>
                <div>
                    <div class="label">Match-Quote</div>
                    <div class="value-big">${winQuote}%</div>
                    <div class="progress-bg">
                        <div class="progress-bar green" style="width: ${winQuote}%"></div>
                    </div>
                </div>
                <div>
                    <div class="label">Leg-Verhältnis</div>
                    <div class="value-big">${spieler.legsGew}:${spieler.legsVerl}</div>
                    <div class="progress-bg">
                        <div class="progress-bar blue" style="width: ${legQuote}%"></div>
                    </div>
                </div>
            </div>
        `;
        
        wrapper.appendChild(card);
    });
}

function ladeDaten() {
    fetch(CSV_URL)
        .then(response => {
            if (!response.ok) throw new Error("Datei nicht gefunden");
            return response.text();
        })
        .then(data => {
            const spieler = parseDartsCSV(data);
            generiereKarten(spieler);
        })
        .catch(error => {
            console.error('Fehler beim Laden:', error);
            const wrapper = document.getElementById('app-wrapper');
            if (wrapper) {
                wrapper.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#ef4444;">Fehler beim Laden der daten.csv.</p>';
            }
        });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ladeDaten);
} else {
    ladeDaten();
}
