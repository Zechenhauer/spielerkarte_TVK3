const CSV_KADER_URL = "daten.csv?v=" + new Date().getTime();
const CSV_SPIELTAGE_URL = "spieltage.csv?v=" + new Date().getTime();

let aktuelleAnsicht = 'gesamt'; // 'gesamt' oder 'spieltag'
let kaderDatenGlobal = [];
let spieltageDatenGlobal = [];
let verfuegbareSpieltage = [];

function parseCSVLine(line) {
    const separator = line.includes(';') ? ';' : ',';
    return line.split(separator).map(cell => cell.trim().replace(/"/g, ''));
}

function formatiereName(roherName) {
    if (!roherName) return "";
    let name = roherName.trim();
    if (name.includes(' ') && !name.includes(',')) {
        const teile = name.split(' ');
        if (teile.length === 2) return `${teile[1]}, ${teile[0]}`;
        if (teile.length > 2) {
            const nachname = teile.pop();
            return `${nachname}, ${teile.join(' ')}`;
        }
    }
    return name;
}

function parseKaderCSV(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const liste = [];
    if (lines.length < 2) return liste;

    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (!row[0] || row[0] === "Name" || row[0] === "") continue;
        liste.push({
            name: formatiereName(row[0]),
            matches: parseInt(row[1]) || 0,
            siege: parseInt(row[2]) || 0,
            niederlagen: parseInt(row[3]) || 0,
            legsGew: parseInt(row[4]) || 0,
            legsVerl: parseInt(row[5]) || 0,
            avg: parseFloat(row[6]?.replace(',', '.')) || 0.0
        });
    }
    liste.sort((a, b) => b.avg - a.avg);
    return liste;
}

function parseSpieltageCSV(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const eintraege = [];
    if (lines.length < 2) return eintraege;

    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (!row[0] || !row[4] || row[0] === "Spieltag") continue;

        eintraege.push({
            spieltag: row[0],
            datum: row[1] || "",
            gegnerTeam: row[2] || "Unbekannt",
            endergebnis: row[3] || "",
            block: row[4] || "",
            spielerKapellenRaw: row[5] || "", 
            gegnerName: row[6] || "",
            ergebnisSpiel: row[7] || "", 
            avg: parseFloat(row[8]?.replace(',', '.')) || 0.0,
            dartsRaw: row[9] || "", 
            sg: row[10] || "", 
            hunderachtziger: parseInt(row[11]) || 0,
            hf: row[12] || ""
        });
    }
    return eintraege;
}

function berechneSpieltagKarten(gewaehlterSpieltag) {
    const spieltagZeilen = spieltageDatenGlobal.filter(z => z.spieltag == gewaehlterSpieltag);
    if (spieltagZeilen.length === 0) return [];

    const spielerAbendStats = {};

    spieltagZeilen.forEach(zeile => {
        const istDoppel = zeile.spielerKapellenRaw.includes('/');
        let spielerAnDiesemTisch = [];
        
        if (istDoppel) {
            spielerAnDiesemTisch = zeile.spielerKapellenRaw.split('/').map(n => formatiereName(n));
        } else {
            spielerAnDiesemTisch = [formatiereName(zeile.spielerKapellenRaw)];
        }

        const ergTeile = zeile.ergebnisSpiel.split(':').map(x => parseInt(x) || 0);
        const legsGewonnen = ergTeile[0] || 0;
        const legsVerloren = ergTeile[1] || 0;
        const spielGewonnen = legsGewonnen > legsVerloren;

        spielerAnDiesemTisch.forEach(name => {
            if (!name) return;
            if (!spielerAbendStats[name]) {
                spielerAbendStats[name] = {
                    name: name,
                    gegnerTeam: zeile.gegnerTeam,
                    datum: zeile.datum,
                    matches: 0,
                    siege: 0,
                    niederlagen: 0,
                    einzelGespielt: 0,
                    einzelSiege: 0,
                    einzelNiederlagen: 0,
                    einzelAvgSumme: 0,
                    einzelAvgAnzahl: 0,
                    einzelLegsGew: 0,
                    einzelLegsVerl: 0,
                    doppelGespielt: 0,
                    doppelSiege: 0,
                    doppelNiederlagen: 0,
                    doppelAvgSumme: 0,
                    doppelAvgAnzahl: 0,
                    doppelLegsGew: 0,
                    doppelLegsVerl: 0,
                    doppelDetails: [],
                    legsGew: 0,
                    legsVerl: 0,
                    avgSumme: 0,
                    avgSpieleAnzahl: 0,
                    hunderachtziger: 0,
                    highfinishes: [],
                    shortGames: [],
                    einzelDartsListe: [],
                    doppelDartsListe: []
                };
            }

            const s = spielerAbendStats[name];
            s.matches += 1;
            if (spielGewonnen) s.siege += 1; else s.niederlagen += 1;
            s.legsGew += legsGewonnen;
            s.legsVerl += legsVerloren;

            const hatDarts = zeile.dartsRaw && zeile.dartsRaw !== "" && zeile.dartsRaw !== "0";

            if (istDoppel) {
                s.doppelGespielt += 1;
                s.doppelLegsGew += legsGewonnen;
                s.doppelLegsVerl += legsVerloren;
                if (spielGewonnen) s.doppelSiege += 1; else s.doppelNiederlagen += 1;
                if (zeile.avg > 0) {
                    s.doppelAvgSumme += zeile.avg;
                    s.doppelAvgAnzahl += 1;
                }
                const partner = spielerAnDiesemTisch.find(p => p !== name) || "Unbekannt";
                s.doppelDetails.push({ partner: partner, ergebnis: zeile.ergebnisSpiel });
                if (hatDarts) s.doppelDartsListe.push(zeile.dartsRaw);
            } else {
                s.einzelGespielt += 1;
                s.einzelLegsGew += legsGewonnen;
                s.einzelLegsVerl += legsVerloren;
                if (spielGewonnen) s.einzelSiege += 1; else s.einzelNiederlagen += 1;
                if (zeile.avg > 0) {
                    s.einzelAvgSumme += zeile.avg;
                    s.einzelAvgAnzahl += 1;
                }
                if (hatDarts) s.einzelDartsListe.push(zeile.dartsRaw);
            }

            if (zeile.avg > 0) {
                s.avgSumme += zeile.avg;
                s.avgSpieleAnzahl += 1;
            }
            if (zeile.hunderachtziger > 0) s.hunderachtziger += zeile.hunderachtziger;
            if (zeile.hf && zeile.hf !== "" && zeile.hf !== "0") s.highfinishes.push(zeile.hf);
            if (zeile.sg && zeile.sg !== "" && zeile.sg !== "0") s.shortGames.push(zeile.sg);
        });
    });

    const liste = Object.values(spielerAbendStats).map(s => {
        s.avgFinal = s.avgSpieleAnzahl > 0 ? (s.avgSumme / s.avgSpieleAnzahl) : 0.0;
        s.avgEinzelFinal = s.einzelAvgAnzahl > 0 ? (s.einzelAvgSumme / s.einzelAvgAnzahl) : 0.0;
        s.avgDoppelFinal = s.doppelAvgAnzahl > 0 ? (s.doppelAvgSumme / s.doppelAvgAnzahl) : 0.0;
        return s;
    });
    liste.sort((a, b) => b.avgFinal - a.avgFinal);
    return liste;
}

function renderKader(daten) {
    const wrapper = document.getElementById('app-wrapper');
    wrapper.innerHTML = '';

    if (daten.length === 0) {
        wrapper.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#94a3b8;">Keine Spielerdaten gefunden.</p>';
        return;
    }

    daten.forEach(spieler => {
        const winQuote = spieler.matches > 0 ? ((spieler.siege / spieler.matches) * 100).toFixed(2) : "0.00";
        const totalLegs = spieler.legsGew + spieler.legsVerl;
        const legQuote = totalLegs > 0 ? ((spieler.legsGew / totalLegs) * 100).toFixed(2) : "0.00";

        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `
            <h2>${spieler.name}</h2>
            <div class="club-tag">TV KAPELLEN 1919</div>
            <div class="divider"></div>
            <div class="inner-data-box">
                <div class="inner-title">3. Mannschaft — Leistungsdaten</div>
                <div class="stats-grid">
                    <div>
                        <div class="label">Matches Gesamt</div>
                        <div class="value-big">${spieler.matches}</div>
                        <div class="label" style="margin-top: 1rem;">Bilanz (G : V)</div>
                        <div class="value-big"><span class="bilanz-gewonnen">${spieler.siege}</span> : <span class="bilanz-verloren">${spieler.niederlagen}</span></div>
                        <div class="label" style="margin-top: 1rem;">Win-Rate (${winQuote}%)</div>
                        <div class="progress-bg"><div class="progress-bar green" style="width: ${winQuote}%"></div></div>
                    </div>
                    <div>
                        <div class="label">AVG</div>
                        <div><div class="value-avg-box">${spieler.avg.toFixed(2)}</div></div>
                        <div class="label" style="margin-top: 0.6rem;">Legs (Gew : Verl)</div>
                        <div class="value-big">${spieler.legsGew} : ${spieler.legsVerl}</div>
                        <div class="label" style="margin-top: 1rem;">Leg-Rate (${legQuote}%)</div>
                        <div class="progress-bg"><div class="progress-bar blue" style="width: ${legQuote}%"></div></div>
                    </div>
                </div>
            </div>
        `;
        wrapper.appendChild(card);
    });
}

function renderSpieltag(daten, n_spieltag) {
    const wrapper = document.getElementById('app-wrapper');
    wrapper.innerHTML = '';

    if (daten.length === 0) {
        wrapper.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#94a3b8;">Keine Spieldaten für den Spieltag ${n_spieltag} vorhanden.</p>`;
        return;
    }

    daten.forEach(s => {
        const winQuote = s.matches > 0 ? ((s.siege / s.matches) * 100).toFixed(2) : "0.00";
        const totalLegs = s.legsGew + s.legsVerl;
        const legQuote = totalLegs > 0 ? ((s.legsGew / totalLegs) * 100).toFixed(2) : "0.00";

        let specialsHTML = '';
        if (s.hunderachtziger > 0) {
            specialsHTML += `<span class="special-badge">🎯 180er: x${s.hunderachtziger}</span>`;
        }
        s.highfinishes.forEach(hf => {
            specialsHTML += `<span class="special-badge">🔥 HF: ${hf}</span>`;
        });
        s.shortGames.forEach(sg => {
            specialsHTML += `<span class="special-badge">⚡ SG: ${sg} D.</span>`;
        });

        // Spiele-Aufteilung HTML
        let spielAufteilungHTML = '';
        if (s.einzelGespielt > 0) {
            spielAufteilungHTML += `<div style="font-size:0.85rem; color:#cbd5e1; margin-top:0.2rem;"> davon Einzel: <b>${s.einzelGespielt}</b> (<span class="bilanz-gewonnen">${s.einzelSiege}</span>:<span class="bilanz-verloren">${s.einzelNiederlagen}</span>)</div>`;
        }
        if (s.doppelGespielt > 0) {
            spielAufteilungHTML += `<div style="font-size:0.85rem; color:#cbd5e1; margin-top:0.1rem;"> davon Doppel: <b>${s.doppelGespielt}</b> (<span class="bilanz-gewonnen">${s.doppelSiege}</span>:<span class="bilanz-verloren">${s.doppelNiederlagen}</span>)</div>`;
            s.doppelDetails.forEach(d => {
                spielAufteilungHTML += `<div style="font-size:0.8rem; color:#94a3b8; margin-left:0.5rem; margin-top:0.05rem;">└ mit ${d.partner} (${d.ergebnis})</div>`;
            });
        }

        // AVG-Aufteilung HTML
        let avgAufteilungHTML = '';
        if (s.einzelGespielt > 0 && s.doppelGespielt > 0) {
            avgAufteilungHTML += `<div style="font-size:0.85rem; color:#cbd5e1; margin-top:0.3rem; text-align:center;">Einzel-Ø: <b>${s.avgEinzelFinal.toFixed(2)}</b> | Doppel-Ø: <b>${s.avgDoppelFinal.toFixed(2)}</b></div>`;
        }

        // NEU: Legs-Aufteilung HTML
        let legsAufteilungHTML = '';
        if (s.einzelGespielt > 0 && s.doppelGespielt > 0) {
            legsAufteilungHTML += `<div style="font-size:0.85rem; color:#cbd5e1; margin-top:0.3rem; text-align:center;">Einzel-Legs: <b>${s.einzelLegsGew}:${s.einzelLegsVerl}</b> | Doppel-Legs: <b>${s.doppelLegsGew}:${s.doppelLegsVerl}</b></div>`;
        }

        // Darts pro Leg-Aufteilung HTML
        let dartsAufteilungHTML = '';
        if (s.einzelDartsListe.length === 0 && s.doppelDartsListe.length === 0) {
            dartsAufteilungHTML = `<div style="font-size: 0.9rem; font-weight: 700; color: #94a3b8; margin-top: 0.2rem;">—</div>`;
        } else {
            if (s.einzelDartsListe.length > 0) {
                const einzelDartsStr = s.einzelDartsListe.join(' | ').replace(/\//g, '|');
                dartsAufteilungHTML += `<div style="font-size: 0.85rem; font-weight: 500; color: #cbd5e1; margin-top: 0.2rem;">Einzel: <span style="font-weight:700; color:#fff;">${einzelDartsStr}</span></div>`;
            }
            if (s.doppelDartsListe.length > 0) {
                const doppelDartsStr = s.doppelDartsListe.join(' | ').replace(/\//g, '|');
                dartsAufteilungHTML += `<div style="font-size: 0.85rem; font-weight: 500; color: #cbd5e1; margin-top: 0.1rem;">Doppel: <span style="font-weight:700; color:#fff;">${doppelDartsStr}</span></div>`;
            }
        }

        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `
            <h2>${s.name}</h2>
            <div class="club-tag">TV KAPELLEN 1919</div>
            <div class="divider"></div>
            <div class="inner-data-box">
                <div class="inner-title">Spieltag ${spieltagSelect.value} vs. ${s.gegnerTeam}</div>
                <div class="stats-grid">
                    <div>
                        <div class="label">Spiele am Abend</div>
                        <div class="value-big">${s.matches}</div>
                        
                        ${spielAufteilungHTML}

                        <div class="label" style="margin-top: 0.8rem;">Abend-Bilanz</div>
                        <div class="value-big"><span class="bilanz-gewonnen">${s.siege}</span> : <span class="bilanz-verloren">${s.niederlagen}</span></div>
                        <div class="label" style="margin-top: 0.8rem;">Win-Rate (${winQuote}%)</div>
                        <div class="progress-bg"><div class="progress-bar green" style="width: ${winQuote}%"></div></div>
                        ${specialsHTML !== '' ? `<div class="label" style="margin-top: 0.8rem;">Specials</div><div style="margin-top: 0.25rem;">${specialsHTML}</div>` : ''}
                    </div>
                    <div>
                        <div class="label">Abend-Schnitt (Gesamt-AVG)</div>
                        <div><div class="value-avg-box">${s.avgFinal > 0 ? s.avgFinal.toFixed(2) : "0.00"}</div></div>
                        
                        ${avgAufteilungHTML}

                        <div class="label" style="margin-top: 0.6rem;">Leg-Verhältnis</div>
                        <div class="value-big">${s.legsGew} : ${s.legsVerl}</div>
                        
                        ${legsAufteilungHTML}

                        <div class="label" style="margin-top: 0.8rem;">Leg-Rate (${legQuote}%)</div>
                        <div class="progress-bg"><div class="progress-bar blue" style="width: ${legQuote}%"></div></div>
                        
                        <div class="label" style="margin-top: 0.9rem;">Darts pro Leg</div>
                        <div style="margin-top: 0.1rem; word-break: break-all; letter-spacing: 0.5px;">
                            ${dartsAufteilungHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;
        wrapper.appendChild(card);
    });
}

const spieltagSelect = document.getElementById('spieltag-select');
const spieltagWrapper = document.getElementById('spieltag-select-wrapper');

function switchView(view) {
    aktuelleAnsicht = view;
    document.getElementById('btn-gesamt').classList.toggle('active', view === 'gesamt');
    document.getElementById('btn-spieltag').classList.toggle('active', view === 'spieltag');
    
    if (view === 'gesamt') {
        spieltagWrapper.style.display = 'none';
        document.getElementById('sub-title').innerText = "Saison 2026/27 — Kader-Dashboard";
        renderKader(kaderDatenGlobal);
    } else {
        spieltagWrapper.style.display = 'flex';
        document.getElementById('sub-title').innerText = "Saison 2026/27 — Spieltag-Highlights";
        spieltagWechseln();
    }
}

function spieltagWechseln() {
    const gewaehlterSpieltag = spieltagSelect.value;
    const abendDaten = berechneSpieltagKarten(gewaehlterSpieltag);
    renderSpieltag(abendDaten, gewaehlterSpieltag);
}

function initialisiereApp() {
    fetch(CSV_KADER_URL)
        .then(res => res.text())
        .then(kaderText => {
            kaderDatenGlobal = parseKaderCSV(kaderText);
            return fetch(CSV_SPIELTAGE_URL);
        })
        .then(res => {
            if (!res.ok) throw new Error("Keine spieltage.csv gefunden");
            return res.text();
        })
        .then(spieltageText => {
            spieltageDatenGlobal = parseSpieltageCSV(spieltageText);
            
            const spieltageSet = new Set(spieltageDatenGlobal.map(z => z.spieltag));
            verfuegbareSpieltage = Array.from(spieltageSet).sort((a, b) => a - b);
            
            spieltagSelect.innerHTML = '';
            verfuegbareSpieltage.forEach(st => {
                const opt = document.createElement('option');
                opt.value = st;
                opt.innerText = `Spieltag ${st}`;
                spieltagSelect.appendChild(opt);
            });

            switchView('gesamt');
        })
        .catch(err => {
            console.error("Fehler beim App-Start:", err);
            renderKader(kaderDatenGlobal);
        });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialisiereApp);
} else {
    initialisiereApp();
}
