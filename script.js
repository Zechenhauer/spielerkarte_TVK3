const CSV_URL = "daten.csv?v=" + new Date().getTime(); // Verhindert Browser-Caching komplett

// Hilfsfunktion zum sauberen Trennen von CSV-Spalten (berücksichtigt Semikolon und Komma)
function parseCSVLine(line) {
    const separator = line.includes(';') ? ';' : ',';
    return line.split(separator).map(cell => cell.trim().replace(/"/g, ''));
}

function parseDartsCSV(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const spielerListe = [];

    if (lines.length < 2) return spielerListe;

    // Wir gehen ab Zeile 2 (Index 1) durch, da Zeile 1 die Überschriften enthält
    for (let i = 1; i < lines.length; i++) {
        const rowData = parseCSVLine(lines[i]);
        
        // Falls die Zeile leer ist oder kein Name drin steht, überspringen
        if (!rowData[0] || rowData[0] === "Name" || rowData[0] === "") continue;

        // Zuordnung basierend auf deinen Spalten: Name, Matches, Siege, Niederlagen, Legs_Gew, Legs_Verl, AVG
        const spieler = {
            name: rowData[0],
            matches: parseInt(rowData[1]) || 0,
            siege: parseInt(rowData[2]) || 0,
            niederlagen: parseInt(rowData[3]) || 0,
            legsGew: parseInt(rowData[4]) || 0,
            legsVerl: parseInt(rowData[5]) || 0,
            avg: parseFloat(rowData[6]?.replace(',', '.')) || 0.0
        };

        spielerListe.push(spieler);
    }

    return spielerListe;
}

function generiereKarten(spielerDaten) {
    const wrapper = document.getElementById('app-wrapper');
    if (!wrapper) return;

    wrapper.innerHTML = ''; // Platzhalter löschen

    if (spielerDaten.length === 0) {
        wrapper.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#9ca3af;">Keine Spieler in der daten.csv gefunden.</p>';
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
            if (!response.ok) throw new Error("daten.csv konnte nicht geladen werden");
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
                wrapper.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#ef4444;">Fehler beim Laden der Spieldaten.</p>';
            }
        });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ladeDaten);
} else {
    ladeDaten();
}
