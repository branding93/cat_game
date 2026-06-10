// --- 1. GAME STATE ---
const game = {
    day: 1,
    hour: 8,
    minute: 0,
    speed: 1,
    loopId: null,
    status: 'playing'
};
const haushalt = {
    feeder: 8,
    water: 100,
    litter: 0,
    blanketOn: true,
    sofaHealth: 100,
    scratchPost: 100
};
const cats = {
    david: {
        name: "David",
        energy: 100, hunger: 100, mood: 100, fell: 100, weight: 5.0, activity: 0,
        baseWeight: 5.0, isSleeping: true, playChance: 0.2,
        visualState: null, visualStateUntil: 0,
        hungerAtZeroSince: null
    },
    solom: {
        name: "Solom",
        energy: 100, hunger: 100, mood: 100, fell: 100, weight: 4.0, activity: 0,
        baseWeight: 4.0, isSleeping: false, playChance: 0.9,
        visualState: null, visualStateUntil: 0,
        hungerAtZeroSince: null
    }
};
// --- 2. GAME LOOP (Die Zeit) ---
function startGame() {
    if (game.loopId) clearInterval(game.loopId);
    if (game.speed === 0 || game.status === 'gameover') return;
    const tickRate = game.speed === 1 ? 1000 : 100; // 1 Sekunde = 1 Minute Ingame (Normal)
    game.loopId = setInterval(() => {
        game.minute++;
        if (game.minute >= 60) {
            game.minute = 0;
            game.hour++;
            onHourChange();
            if (game.hour >= 24) {
                game.hour = 0;
                game.day++;
            }
        }
        onTick();
        updateUI();
    }, tickRate);
}
function setSpeed(speedMultiplier) {
    game.speed = speedMultiplier;
    document.querySelectorAll('.time-controls button').forEach(b => b.classList.remove('active'));
    if(speedMultiplier === 0) document.getElementById('btn-pause').classList.add('active');
    if(speedMultiplier === 1) document.getElementById('btn-normal').classList.add('active');
    if(speedMultiplier === 10) document.getElementById('btn-fast').classList.add('active');
    startGame();
}
// --- 3. LOGIK PRO TICK (Jede Minute) ---
function onTick() {
    if (game.status === 'gameover') return;
    // Haushalt
    haushalt.water = Math.max(0, haushalt.water - 0.05);
    // Katzen Needs
    updateCatNeeds('david', 0.02, 0.05); // David verliert langsam Energie
    // Soloms Energieabfall ändert sich nachts
    const isNight = (game.hour >= 22 || game.hour < 5);
    const solomDrain = isNight ? 0.2 : 0.08;
    updateCatNeeds('solom', solomDrain, 0.07);
    // Zerstörung Sofa
    if (isNight && cats.solom.energy > 50 && !haushalt.blanketOn) {
        haushalt.sofaHealth = Math.max(0, haushalt.sofaHealth - 0.2);
        if (Math.random() < 0.05) log("⚠️ ¡Solom está arañando el sofá sin protección!");
    }
    checkStarvation('david');
    checkStarvation('solom');
}
function updateCatNeeds(id, energyDrain, hungerDrain) {
    let c = cats[id];
    if (c.isSleeping) {
        c.energy = Math.min(100, c.energy + (id==='david' ? 0.5 : 0.2));
        if (c.energy > 90 && Math.random() < 0.1) c.isSleeping = false;
    } else {
        c.energy = Math.max(0, c.energy - energyDrain);
        if (c.energy < 20) c.isSleeping = true;
    }
    c.hunger = Math.max(0, c.hunger - hungerDrain);
    c.fell = Math.max(0, c.fell - 0.02);
    // Laune wird beeinflusst von Hunger, Klo und Fell
    let moodPenalty = 0;
    if (c.hunger < 30) moodPenalty += 0.1;
    if (haushalt.litter > 70) moodPenalty += 0.2;
    if (c.fell < 50) moodPenalty += 0.1;
    c.mood = Math.max(0, c.mood - moodPenalty);
    // Gewicht im Grundzustand
    if (c.activity < 20 && c.hunger > 80 && c.isSleeping) {
        c.weight += 0.0001; // Wird langsam dick
    }
    // Klo Benutzung (zufällig basierend auf Futter)
    if (Math.random() < 0.005) {
        haushalt.litter = Math.min(100, haushalt.litter + 5);
    }
}
function applyWeightGainFromOvereating(id, hungerBeforeEating) {
    if (hungerBeforeEating > 80) {
        cats[id].weight += 0.02;
    }
}
function reduceEnergyFromPlay(id, amount) {
    const adjustedAmount = id === 'solom' ? amount * 0.5 : amount;
    cats[id].energy = Math.max(0, cats[id].energy - adjustedAmount);
}
function applyPlayWeightLoss(id, amount) {
    const weightLoss = amount * 0.0005;
    cats[id].weight = Math.max(cats[id].baseWeight * 0.8, cats[id].weight - weightLoss);
}
function handlePlayEffects(id, energyAmount) {
    reduceEnergyFromPlay(id, energyAmount);
    applyPlayWeightLoss(id, energyAmount);
}
function checkStarvation(id) {
    const c = cats[id];
    if (game.status === 'gameover') return;
    if (c.hunger > 0) {
        c.hungerAtZeroSince = null;
        return;
    }
    if (c.hungerAtZeroSince === null) {
        c.hungerAtZeroSince = game.day * 24 + game.hour;
        log(`⚠️ ¡${c.name} tiene mucha hambre! ¡Necesita comer urgente!`);
        return;
    }
    const currentTime = game.day * 24 + game.hour;
    if (currentTime - c.hungerAtZeroSince >= 6) {
        triggerGameOver(id);
    }
}
function triggerGameOver(id) {
    game.status = 'gameover';
    setSpeed(0);
    const c = cats[id];
    document.getElementById('death-message').innerHTML = `💔 <strong>${c.name}</strong> ha fallecido de hambre después de <strong>${game.day}</strong> día${game.day !== 1 ? 's' : ''}.`;
    document.getElementById('survived-days').innerText = game.day;
    document.getElementById('death-stats').innerText = `${c.name} – Energía: ${Math.round(c.energy)} | Hambre: ${Math.round(c.hunger)} | Ánimo: ${Math.round(c.mood)} | Peso: ${c.weight.toFixed(2)}kg`;
    document.getElementById('gameover-overlay').classList.remove('hidden');
    log(`💔 ${c.name} ha fallecido.`);
}
function restartGame() {
    document.getElementById('gameover-overlay').classList.add('hidden');
    game.day = 1;
    game.hour = 8;
    game.minute = 0;
    game.speed = 1;
    game.status = 'playing';
    game.loopId = null;
    haushalt.feeder = 8;
    haushalt.water = 100;
    haushalt.litter = 0;
    haushalt.blanketOn = true;
    haushalt.sofaHealth = 100;
    haushalt.scratchPost = 100;
    cats.david = {
        name: "David",
        energy: 100, hunger: 100, mood: 100, fell: 100, weight: 5.0, activity: 0,
        baseWeight: 5.0, isSleeping: true, playChance: 0.2,
        visualState: null, visualStateUntil: 0,
        hungerAtZeroSince: null
    };
    cats.solom = {
        name: "Solom",
        energy: 100, hunger: 100, mood: 100, fell: 100, weight: 4.0, activity: 0,
        baseWeight: 4.0, isSleeping: false, playChance: 0.9,
        visualState: null, visualStateUntil: 0,
        hungerAtZeroSince: null
    };
    document.getElementById('log').innerHTML = '¡Bienvenido al simulador de gatos!';
    document.querySelectorAll('.time-controls button').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-normal').classList.add('active');
    updateUI();
    setSpeed(1);
}
// --- 4. EVENTS ---
function onHourChange() {
    // Futterautomat (8x am Tag: 0, 3, 6, 9, 12, 15, 18, 21 Uhr)
    if (game.hour % 3 === 0) {
        if (haushalt.feeder >= 2) {
            const davidHungerBeforeEating = cats.david.hunger;
            const solomHungerBeforeEating = cats.solom.hunger;
            haushalt.feeder -= 2;
            cats.david.hunger = Math.min(100, cats.david.hunger + 40);
            cats.solom.hunger = Math.min(100, cats.solom.hunger + 40);
            applyWeightGainFromOvereating('david', davidHungerBeforeEating);
            applyWeightGainFromOvereating('solom', solomHungerBeforeEating);
            log(`¡El dispensador dio comida! (Quedan ${haushalt.feeder} porciones)`);
        } else {
            log("⚠️ ¡El dispensador de comida está vacío!");
            cats.david.mood = Math.max(0, cats.david.mood - 20);
            cats.solom.mood = Math.max(0, cats.solom.mood - 20);
        }
    }
}
// --- 5. INTERAKTIONEN ---
function feedCat(id, type) {
    if (game.status === 'gameover') return;
    if (id === 'david' && type === 'nass') {
        log("David huele la comida húmeda y se da la vuelta con cara de desagrado.");
        cats.david.mood = Math.max(0, cats.david.mood - 10);
    } else {
        const hungerBeforeEating = cats[id].hunger;
        cats[id].hunger = 100;
        cats[id].isSleeping = false;
        haushalt.litter = Math.min(100, haushalt.litter + 2); // Fressen macht voll
        applyWeightGainFromOvereating(id, hungerBeforeEating);
        log(`${cats[id].name} comió alimento ${type === 'trocken' ? 'seco' : 'húmedo'}.`);
    }
    updateUI();
}
function groomCat(id) {
    if (game.status === 'gameover') return;
    if (cats[id].fell < 50) log(`El pelaje de ${cats[id].name} estaba enredado. Cepillarlo tomó bastante tiempo.`);
    cats[id].fell = 100;
    cats[id].mood = Math.min(100, cats[id].mood + 10);
    log(`${cats[id].name} fue cepillado.`);
    updateUI();
}
function petCat(id) {
    if (game.status === 'gameover') return;
    if (id === 'david') {
        cats.david.mood = 100;
        cats.david.isSleeping = false;
        log("David se acurruca feliz en tu mano. Prrr...");
    }
    if (id === 'solom') {
        cats.solom.mood = 100;
        cats.solom.isSleeping = false;
        log("Solom se acerca, se sienta sobre tus piernas y se acurruca en tu regazo. Prrr...");
    }
    updateUI();
}
function toggleBlanket() {
    haushalt.blanketOn = !haushalt.blanketOn;
    log(`La manta ahora está ${haushalt.blanketOn ? 'SOBRE' : 'FUERA DE'} el sofá.`);
    updateUI();
}
function playWith(id) {
    if (game.status === 'gameover') return;
    const toy = document.getElementById('toy-select').value;
    let success = false;
    let c = cats[id];
    c.isSleeping = false;
    if (id === 'david') {
        if (toy === 'karton') {
            success = true;
            log("David salta dentro de la caja. ¡Solo se le ven los ojos!");
            c.mood = 100;
            handlePlayEffects('david', 8);
            setTemporaryVisualState('david', 'karton', 3500);
        }
        else if (toy === 'kaefer') {
            success = true;
            log("David observa el escarabajo. Casi no se mueve, pero está entretenido.");
            c.activity += 20;
            handlePlayEffects('david', 10);
            setTemporaryVisualState('david', 'spielt', 2500);
        }
        else if (Math.random() < c.playChance) {
            success = true;
            log("¡Increíble! David juega un rato.");
            c.activity += 50;
            handlePlayEffects('david', 20);
            setTemporaryVisualState('david', 'spielt', 2500);
        }
        else {
            log("David bosteza e ignora el juguete.");
            c.mood = Math.max(0, c.mood - 5);
        }
    }
    if (id === 'solom') {
        if (toy === 'laser') {
            success = true;
            log("¡Solom corre detrás del láser como loco!");
            c.activity += 80;
            handlePlayEffects('solom', 40);
            setTemporaryVisualState('solom', 'spielt', 2500);
        }
        else if (toy === 'stab') {
            success = true;
            log("¡Solom salta hacia la varita!");
            c.activity += 50;
            handlePlayEffects('solom', 20);
            setTemporaryVisualState('solom', 'spielt', 2500);
        }
        else if (toy === 'minze') {
            success = true;
            log("Solom está ocupado en el rascador.");
            haushalt.scratchPost = Math.max(0, haushalt.scratchPost - 10);
            handlePlayEffects('solom', 12);
            setTemporaryVisualState('solom', 'spielt', 2500);
        }
        else {
            success = true;
            log("Solom juega feliz.");
            c.activity += 30;
            handlePlayEffects('solom', 15);
            setTemporaryVisualState('solom', 'spielt', 2500);
        }
    }
    if (toy === 'baldrian' && success) {
        c.mood = 100;
        setTimeout(() => {
            c.isSleeping = true;
            log(`${c.name} se quedó dormido por la valeriana.`);
            updateUI();
        }, 2000);
    }
    if (toy === 'laser' && id === 'solom') {
        log("David mira el juego con láser con cara de fastidio...");
        cats.david.mood = Math.max(0, cats.david.mood - 15);
        setTemporaryVisualState('david', 'sauer', 2500);
    }
    updateUI();
}
function callCat(id) {
    if (game.status === 'gameover') return;
    let c = cats[id];
    let success = false;
    let msg = "";
    if (id === 'david') {
        if (c.isSleeping) {
            if (Math.random() < 0.3) {
                success = true;
                msg = "David se acerca somnoliento y se frota contra tu pierna.";
            } else {
                msg = "David mueve una oreja y se da la vuelta para seguir durmiendo.";
            }
        } else {
            if (Math.random() < (c.mood / 100) * 0.7) {
                success = true;
                msg = "David se acerca curioso y maúlla suavemente.";
            } else {
                msg = "David te mira un momento y sigue acicalándose.";
            }
        }
    }
    if (id === 'solom') {
        const isZoomies = (game.hour >= 22 || game.hour < 5) && c.energy > 50 && !c.isSleeping;
        if (isZoomies) {
            if (Math.random() < 0.1) {
                success = true;
                msg = "Solom se detiene en medio del sprint y te mira con curiosidad.";
            } else {
                msg = "¡Solom pasa como un rayo a tu lado — no tiene tiempo!";
            }
        } else {
            if (Math.random() < (c.mood / 100) * 0.8) {
                success = true;
                msg = "¡Solom viene saltando de inmediato y ronronea como un motor!";
            } else {
                msg = "Solom levanta la cabeza un momento. Tiene cosas más importantes que hacer.";
            }
        }
    }
    if (success) {
        c.mood = Math.min(100, c.mood + 5);
        c.isSleeping = false;
        setTemporaryVisualState(id, 'kommt', 2500);
    } else {
        c.mood = Math.max(0, c.mood - 3);
        setTemporaryVisualState(id, 'ignoriert', 2000);
    }
    log(`${cats[id].name}: ${msg}`);
    updateUI();
}
function setTemporaryVisualState(id, state, durationMs) {
    cats[id].visualState = state;
    cats[id].visualStateUntil = Date.now() + durationMs;
}
function getVisualState(id) {
    const c = cats[id];
    if (c.visualState && c.visualStateUntil > Date.now()) return c.visualState;
    c.visualState = null;
    c.visualStateUntil = 0;
    if (c.isSleeping) return 'schlaeft';
    if (c.hunger < 30) return 'hungrig';
    if (c.mood < 30) return 'sauer';
    if (id === 'solom' && (game.hour >= 22 || game.hour < 5) && !c.isSleeping) return 'zoomies';
    return 'idle';
}
function renderCatSprite(id, visualState, fallbackEmoji) {
    const spriteEl = document.getElementById(`sprite-${id}`);
    const imagePath = `pics/${id}_${visualState}.png`;
    spriteEl.dataset.expectedSrc = imagePath;
    const testImage = new Image();
    testImage.onload = function() {
        if (spriteEl.dataset.expectedSrc !== imagePath) return;
        spriteEl.innerHTML = `<img src="${imagePath}" alt="${cats[id].name}" style="background: transparent; max-width: 100%; max-height: 96px; width: auto; height: auto; display: inline-block;" />`;
    };
    testImage.onerror = function() {
        if (spriteEl.dataset.expectedSrc !== imagePath) return;
        spriteEl.textContent = fallbackEmoji;
    };
    testImage.src = imagePath;
}
// --- 6. UI UPDATE & LOGGING ---
function log(msg) {
    const l = document.getElementById('log');
    l.innerHTML = `[${formatTime()}] ${msg}<br>` + l.innerHTML;
}
function formatTime() {
    return `${game.hour.toString().padStart(2, '0')}:${game.minute.toString().padStart(2, '0')}`;
}
function updateUI() {
    // Zeit
    document.getElementById('ui-time').innerText = formatTime();
    document.getElementById('ui-day').innerText = game.day;
    // Haushalt
    document.getElementById('ui-feeder').innerText = haushalt.feeder;
    document.getElementById('ui-water').value = haushalt.water;
    document.getElementById('ui-water-val').innerText = Math.round(haushalt.water) + '%';
    const litterEl = document.getElementById('ui-litter');
    litterEl.value = haushalt.litter;
    litterEl.className = haushalt.litter > 70 ? 'warning' : '';
    document.getElementById('ui-litter-val').innerText = Math.round(haushalt.litter) + '%';
    document.getElementById('ui-sofa').value = haushalt.sofaHealth;
    document.getElementById('ui-sofa-val').innerText = Math.round(haushalt.sofaHealth) + '%';
    document.getElementById('ui-blanket').innerText = haushalt.blanketOn ? "COLOCADA (Seguro)" : "NO ESTÁ (¡Peligro!)";
    document.getElementById('ui-blanket').style.color = haushalt.blanketOn ? "var(--success)" : "var(--danger)";
    // Katzen Stats & Visuals
    ['david', 'solom'].forEach(id => {
        let c = cats[id];
        document.getElementById(`e-${id}`).value = c.energy;
        document.getElementById(`h-${id}`).value = c.hunger;
        document.getElementById(`m-${id}`).value = c.mood;
        document.getElementById(`f-${id}`).value = c.fell;
        document.getElementById(`weight-${id}`).innerText = c.weight.toFixed(2);
        // Sprite / Text Logic
        let statusText = c.isSleeping ? "Duerme profundamente 💤" : "Está despierto y mirando alrededor 👀";
        let sprite = c.isSleeping ? (id==='david' ? '😴' : '💤') : (id==='david' ? '🐈' : '🐈‍⬛');
        const visualState = getVisualState(id);
        if (c.hunger < 30) {
            statusText = "¡Maúlla fuerte por hambre! 😾";
            sprite = '🙀';
        }
        else if (c.mood < 30) {
            statusText = "Está de mal humor.";
            sprite = '😾';
        }
        if(id === 'solom' && (game.hour >= 22 || game.hour < 5) && !c.isSleeping) {
            statusText = "¡Activo de noche! ¡Zoomies! ⚡";
            sprite = '🐆';
        }
        document.getElementById(`status-${id}`).innerText = statusText;
        renderCatSprite(id, visualState, sprite);
    });
    document.querySelectorAll('.btn-group .action-btn').forEach(b => b.disabled = game.status === 'gameover');
}
// Init
updateUI();
startGame();
