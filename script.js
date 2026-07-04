const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTPZoZHS_zlVorc44OgCR4P3sffrTjVo7sEUiZn-Tu_Wyx3L5yeAXXmLwSFRdij1ijKjhxmfTPnRWNe/pub?gid=0&single=true&output=csv";

async function loadData() {
    try {
        const response = await fetch(CSV_URL);
        const text = await response.text();
        
        // CSV Zeilen aufteilen und Überschrift entfernen
        const rows = text.split('\n').slice(1);
        const container = document.getElementById('app-container');
        
        container.innerHTML = ""; // Container leeren

        rows.forEach(row => {
            // Kommas trennen die Spalten
            const cols = row.split(',');
            if (cols.length < 7) return; // Sicherheit, falls eine Zeile leer ist
            
            const [name, matches, siege, niederlagen, legsGew, legsVerl, avg] = cols;

            // Berechnungen für die Fortschrittsbalken
            const winRate = ((parseInt(siege) / parseInt(matches)) * 100 || 0).toFixed(1);
            const totalLegs = parseInt(legsGew) + parseInt(legsVerl);
            const legRate = ((parseInt(legsGew) / totalLegs) * 100 || 0).toFixed(1);

            // Karte in den Container einfügen
            container.innerHTML += `
                <div class="player-card">
                    <div class="header"><h1>${name}</h1><p>TV KAPELLEN 1919</p></div>
                    <div class="stats-grid">
                        <div class="col">
                            <p class="label">MATCHES GESAMT</p><div class="value-big">${matches}</div>
                            <p class="label">BILANZ (G : V)</p><div class="value-big">${siege} : <span class="red">${niederlagen}</span></div>
                            <p class="label">WIN-RATE (${winRate}%)</p>
                            <div class="progress-bg"><div class="progress-bar green" style="width: ${winRate}%"></div></div>
                        </div>
                        <div class="col">
                            <p class="label">3-DART-SCHNITT (AVG)</p><div class="value-avg">${avg}</div>
                            <p class="label">LEGS (GEW : VERL)</p><div class="value-big">${legsGew} : ${legsVerl}</div>
                            <p class="label">LEG-RATE (${legRate}%)</p>
                            <div class="progress-bg"><div class="progress-bar blue" style="width: ${legRate}%"></div></div>
                        </div>
                    </div>
                </div>`;
        });
    } catch (e) {
        console.error("Daten konnten nicht geladen werden:", e);
        document.getElementById('app-container').innerHTML = "<p>Fehler beim Laden der Daten.</p>";
    }
}

loadData();
