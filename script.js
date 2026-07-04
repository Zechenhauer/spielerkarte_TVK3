const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTPZoZHS_zlVorc44OgCR4P3sffrTjVo7sEUiZn-Tu_Wyx3L5yeAXXmLwSFRdij1ijKjhxmfTPnRWNe/pub?gid=0&single=true&output=csv";

async function loadData() {
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error('Netzwerkfehler');
        const text = await response.text();
        const rows = text.split('\n').slice(1);
        const container = document.getElementById('app-container');
        container.innerHTML = ""; 

        rows.forEach(row => {
            const cols = row.split(',');
            if (cols.length < 7) return;
            const [name, matches, siege, niederlagen, legsGew, legsVerl, avg] = cols.map(c => c.trim());

            const m = parseInt(matches) || 0;
            const s = parseInt(siege) || 0;
            const n = parseInt(niederlagen) || 0;
            const lg = parseInt(legsGew) || 0;
            const lv = parseInt(legsVerl) || 0;

            const winRate = m > 0 ? ((s / m) * 100).toFixed(1) : 0;
            const totalLegs = lg + lv;
            const legRate = totalLegs > 0 ? ((lg / totalLegs) * 100).toFixed(1) : 0;

            container.innerHTML += `
                <div class="player-card">
                    <div class="header"><h1>${name}</h1><p>TV KAPELLEN 1919</p></div>
                    <div class="stats-grid">
                        <div class="col">
                            <p class="label">MATCHES GESAMT</p><div class="value-big">${matches}</div>
                            <p class="label">BILANZ (G : V)</p>
                            <div class="value-big">
                                <span class="bilanz-gewonnen">${siege}</span> : <span class="bilanz-verloren">${niederlagen}</span>
                            </div>
                            <p class="label">WIN-RATE (${winRate}%)</p>
                            <div class="progress-bg"><div class="progress-bar green" style="width: ${winRate}%"></div></div>
                        </div>
                        <div class="col">
                            <p class="label">3-DART-SCHNITT (AVG)</p>
                            <div class="value-avg-box">${avg}</div>
                            <p class="label">LEGS (GEW : VERL)</p><div class="value-big">${legsGew} : ${legsVerl}</div>
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
