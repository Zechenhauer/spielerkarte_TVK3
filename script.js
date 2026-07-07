// Der direkte Live-CSV Export-Link deines Google Sheets
const CSV_URL = "https://docs.google.com/spreadsheets/d/1Sqq7iwE5ZcPbqO4J8A2rv3SLoZz8Mpyj9sj2tcAmZ8U/export?format=csv&gid=0";

// Hilfsfunktion zum sauberen Trennen von CSV-Zeilen
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

// Funktion verarbeitet die Tabellenzeilen
function parseDartsCSV(text) {
    const lines = csvToArray(text);
    const spielerListe = [];

    if (lines.length < 2) return spielerListe;

    // Spaltenzuordnung: Index 0: Name, 1: Matches, 2: Siege, 3: Niederlagen, 4: Legs_Gew, 5: Legs_Verl, 6: AVG
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        if (!row[0] || row[0].trim() === "" || row[0] === "Name") continue;

        const spieler = {
            name: row[0].trim(),
            matches: parseInt(row[1]) || 0,
            siege: parseInt(row[2]) || 0,
            niederlagen: parseInt(row[3]) || 0,
            legsGew: parseInt(row[4]) || 0,
            legsVerl: parseInt(row[5]) || 0,
            avg: parseFloat(row[6]?.replace(',', '.')) || 0.0
        };

        spielerListe.push(spieler);
    }
    return spielerListe;
}

// Funktion baut die HTML-Karten
function generiereKarten(spielerDaten) {
    // Sucht sicherheitshalber nach 'app-wrapper' ODER 'app-container' falls sich was verschoben hat
    const wrapper = document.getElementById('app-wrapper') || document.getElementById('app-container');
    
    if (!wrapper) {
        console.error("Fehler: Kein passender HTML-Container gefunden! Bitte index.html prüfen.");
        return;
    }

    wrapper.innerHTML = ''; // Platzhalter löschen

    if (spielerDaten.length === 0) {
        wrapper.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#9ca3af;">Keine Spielerdaten gefunden.</p>';
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

// Funktion, die den Ladevorgang startet
function ladeDaten() {
    fetch(CSV_URL)
        .then(response => response.text())
        .then(data => {
            const spieler = parseDartsCSV(data);
            generiereKarten(spieler);
        })
        .catch(error => {
            console.error('Fehler beim Laden der Spieldaten:', error);
            const wrapper = document.getElementById('app-wrapper') || document.getElementById('app-container');
            if (wrapper) {
                wrapper.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#ef4444;">Fehler beim Laden der Live-Daten aus Google Sheets.</p>';
            }
        });
}

// Wartet aktiv, bis das gesamte HTML geladen wurde, bevor das Skript startet
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ladeDaten);
} else {
    ladeDaten();
}
