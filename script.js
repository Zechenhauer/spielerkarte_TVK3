const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTPZoZHS_zlVorc44OgCR4P3sffrTjVo7sEUiZn-Tu_Wyx3L5yeAXXmLwSFRdij1ijKjhxmfTPnRWNe/pub?gid=0&single=true&output=csv";

async function loadData() {
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error('Netzwerkfehler');
        const text = await response.text();
        const rows = text.split('\n').slice(1);
        
        // 1. Daten in ein Array von Objekten umwandeln
        let playerList = rows.map(row => {
            const cols = row.split(',').map(c => c.trim());
            if (cols.length < 7) return null;
            
            return {
                name: cols[0],
                matches: parseInt(cols[1]) || 0,
                siege: parseInt(cols[2]) || 0,
                niederlagen: parseInt(cols[3]) || 0,
                legsGew: parseInt(cols[4]) || 0,
                legsVerl: parseInt(cols[5]) || 0,
                avg: parseFloat(cols[6].replace(',', '.')) || 0 // Komma zu Punkt für Sicherheit
            };
        }).filter(p => p !== null);

        // 2. Sortieren nach AVG (absteigend: Höchster Wert zuerst)
        playerList.sort((a, b) => b.avg - a.avg);

        // 3. Karten rendern
        const container = document.getElementById('app-container');
        container.innerHTML = ""; 

        playerList.forEach(p => {
            const winRate = p.matches > 0 ? ((p.siege / p.matches) * 100).toFixed(1) : 0;
            const totalLegs = p.legsGew + p.legsVerl;
            const legRate = totalLegs > 0 ? ((p.legsGew / totalLegs) * 100).toFixed(1) : 0;

            container.innerHTML += `
                <div class="player-card">
                    <div class="header"><h1>${p.name}</h1><p>TV KAPELLEN 1919</p></div>
                    <div class="stats-grid">
                        <div class="col">
                            <p class="label">MATCHES GESAMT</p><div class="value-big">${p.matches}</div>
                            <p class="label">BILANZ (G : V)</p>
                            <div class="value-big">
                                <span class="bilanz-gewonnen">${p.siege}</span> : <span class="bilanz-verloren">${p.niederlagen}</span>
                            </div>
                            <p class="label">WIN-RATE (${winRate}%)</p>
                            <div class="progress-bg"><div class="progress-bar green" style="width: ${winRate}%"></div></div>
                        </div>
                        <div class="col">
                            <p class="label">3-DART-SCHNITT (AVG)</p>
                            <div class="value-avg-box">${p.avg.toFixed(2)}</div>
                            <p class="label">LEGS (GEW : VERL)</p><div class="value-big">${p.legsGew} : ${p.legsVerl}</div>
                            <p class="label">LEG-RATE (${legRate}%)</p>
                            <div class="progress-bg"><div class="progress-bar blue" style="width: ${legRate}%"></div></div>
                        </div>
                    </div>
                </div>`;
        });
    } catch (e) {
        console.error("Datenfehler:", e);
        document.getElementById('app-container').innerHTML = '<p style="text-align: center; color: #ef4444;">Fehler beim Laden der Daten.</p>';
    }
}
loadData();
