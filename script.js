// Lädt die Datei direkt aus deinem GitHub-Ordner
const CSV_URL = "daten.csv";

function csvToArray(text) {
    let p = '', c = '', r = [];
    let q = false;
    let row = [''];
    for (let i=0; i<text.length; i++) {
        c = text[i];
        if (c === '"') { q = !q; }
        else if (c === ',' && !q) { row.push(''); }
        else if ((c === '\r' || c === '\n') && !q) {
            if (c === '\r' && text[i+1] === '\n') { i++; }
            r.push(row);
            row = [''];
        } else { row[row.length-1] += c; }
    }
    if (row.length > 1 || row[0] !== '') { r.push(row); }
    return r;
}

function parseDartsCSV(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const spielerListe = [];
    
    let aktuellerSpieler = null;

    lines.forEach(line => {
        // Ignoriere Einleitungstexte
        if (line.startsWith('"') || line.includes("darstellung des aufbaus")) return;

        if (!line.includes(',')) {
            if (aktuellerSpieler) {
                // Filtere auf TV Kapellen 3
                if (aktuellerSpieler.mannschaft === "3") {
                    spielerListe.push(aktuellerSpieler);
                }
            }
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
            const parts = line.split(',');
            const label = parts[0].trim().toLowerCase();
            const value = parts[1] ? parts[1].trim().replace(/"/g, '') : "";

            if (aktuellerSpieler) {
                if (label.includes("mannschaft")) aktuellerSpieler.mannschaft = value;
                if (label.includes("gesamt")) aktuellerSpieler.matches = parseInt(value) || 0;
                if (label.includes("match gew") || label.includes("siege")) aktuellerSpieler.siege = parseInt(value) || 0;
                if (label.includes("match verl") || label.includes("niederlagen")) aktuellerSpieler.niederlagen = parseInt(value) || 0;
                if (label.includes("legs gew")) aktuellerSpieler.legsGew = parseInt(value) || 0;
                if (label.includes("legs verl")) aktuellerSpieler.legsVerl = parseInt(value) || 0;
                if (label.includes("avg") || label.includes("schnitt")) aktuellerSpieler.avg = parseFloat(value.replace(',', '.')) || 0.0;
            }
        }
    });

    if (aktuellerSpieler && aktuellerSpieler.mannschaft === "3") {
        spielerListe.push(aktuellerSpieler);
    }

    return spielerListe;
}

function generiereKarten(spielerDaten) {
    const wrapper = document.getElementById('app-wrapper');
    if (!wrapper) return;

    wrapper.innerHTML = ''; 

    if (spielerDaten.length === 0) {
        wrapper.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#9ca3af;">Keine Spieler für Mannschaft 3 gefunden.</p>';
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
            if (!response.ok) throw new Error("Datei konnte nicht geladen werden");
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
                wrapper.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#ef4444;">Fehler beim Laden der Spieldaten im Repository.</p>';
            }
        });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ladeDaten);
} else {
    ladeDaten();
}
