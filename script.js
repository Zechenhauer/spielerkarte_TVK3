const CSV_URL = "daten.csv?v=" + new Date().getTime();

function parseCSVLine(line) {
    const separator = line.includes(';') ? ';' : ',';
    return line.split(separator).map(cell => cell.trim().replace(/"/g, ''));
}

function parseDartsCSV(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const spielerListe = [];

    if (lines.length < 2) return spielerListe;

    for (let i = 1; i < lines.length; i++) {
        const rowData = parseCSVLine(lines[i]);
        
        if (!rowData[0] || rowData[0] === "Name" || rowData[0] === "") continue;

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

    // Sortierung nach AVG (Höchster zuerst)
    spielerListe.sort((a, b) => b.avg - a.avg);

    return spielerListe;
}

function generiereKarten(spielerDaten) {
    const wrapper = document.getElementById('app-wrapper');
    if (!wrapper) return;

    wrapper.innerHTML = ''; 

    if (spielerDaten.length === 0) {
        wrapper.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#9ca3af;">Keine Spieler in der daten.csv gefunden.</p>';
        return;
    }

    spielerDaten.forEach(spieler => {
        // Berechnungen mit exakt 2 Nachkommastellen
        const winQuote = spieler.matches > 0 ? ((spieler.siege / spieler.matches) * 100).toFixed(2) : "0.00";
        const totalLegs = spieler.legsGew + spieler.legsVerl;
        const legQuote = totalLegs > 0 ? ((spieler.legsGew / totalLegs) * 100).toFixed(2) : "0.00";

        const card = document.createElement('div');
        card.className = 'player-card';

        // Hier ist das perfekt geordnete Layout (Links: Matches & Win-Rate | Rechts: AVG & Legs)
        card.innerHTML = `
            <div>
                <h2>${spieler.name}</h2>
                <div class="status">TV Kapellen 3</div>
            </div>
            
            <div class="stats-grid">
                <div>
                    <div class="label">Matches Gesamt</div>
                    <div class="value-big">${spieler.matches}</div>
                    
                    <div class="label" style="margin-top: 12px;">Bilanz (G : V)</div>
                    <div class="value-big">
                        <span class="bilanz-gewonnen">${spieler.siege}</span> : 
                        <span class="bilanz-verloren">${spieler.niederlagen}</span>
                    </div>
                    
                    <div class="label" style="margin-top: 12px;">Win-Rate (${winQuote}%)</div>
                    <div class="progress-bg">
                        <div class="progress-bar green" style="width: ${winQuote}%"></div>
                    </div>
                </div>
                
                <div>
                    <div class="label">3-Dart-Schnitt (AVG)</div>
                    <div class="value-avg-box">${spieler.avg.toFixed(2)}</div>
                    
                    <div class="label" style="margin-top: 12px;">Legs (Gew : Verl)</div>
                    <div class="value-big">${spieler.legsGew} : ${spieler.legsVerl}</div>
                    
                    <div class="label" style="margin-top: 12px;">Leg-Rate (${legQuote}%)</div>
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