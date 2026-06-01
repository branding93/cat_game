// --- 1. GAME STATE ---
const game = {
    day: 1,
    hour: 8,
    minute: 0,
    speed: 1, // 0 = Pause, 1 = Normal, 10 = Fast
    loopId: null
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
        visualState: null, visualStateUntil: 0
    },
    solom: {
        name: "Solom",
        energy: 100, hunger: 100, mood: 100, fell: 100, weight: 4.0, activity: 0,
        baseWeight: 4.0, isSleeping: false, playChance: 0.9, claws: 100,
        visualState: null, visualStateUntil: 0
    }
};
// --- 2. GAME LOOP (Die Zeit) ---
function startGame() {
    if (game.loopId) clearInterval(game.loopId);
    if (game.speed === 0) return;
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
        if (Math.random() < 0.05) log("⚠️ Solom kratzt am ungeschützten Sofa!");
    }
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
            log(`Automat hat gefüttert! (Noch ${haushalt.feeder} Portionen)`);
        } else {
            log("⚠️ Futterautomat ist leer!");
            cats.david.mood = Math.max(0, cats.david.mood - 20);
            cats.solom.mood = Math.max(0, cats.solom.mood - 20);
        }
    }
}
// --- 5. INTERAKTIONEN ---
function feedCat(id, type) {
    if (id === 'david' && type === 'nass') {
        log("David schnuppert am Nassfutter und dreht sich angewidert weg.");
        cats.david.mood = Math.max(0, cats.david.mood - 10);
    } else {
        const hungerBeforeEating = cats[id].hunger;
        cats[id].hunger = 100;
        cats[id].isSleeping = false;
        haushalt.litter = Math.min(100, haushalt.litter + 2); // Fressen macht voll
        applyWeightGainFromOvereating(id, hungerBeforeEating);
        log(`${cats[id].name} hat ${type}futter gefressen.`);
    }
    updateUI();
}
function groomCat(id) {
    if (cats[id].fell < 50) log(`${cats[id].name}s Fell war verfilzt. Das Kämmen hat lange gedauert.`);
    cats[id].fell = 100;
    cats[id].mood = Math.min(100, cats[id].mood + 10);
    log(`${cats[id].name} wurde gebürstet.`);
    updateUI();
}
function petCat(id) {
    if (id === 'david') {
        cats.david.mood = 100;
        cats.david.isSleeping = false;
        log("David kuschelt sich glücklich in deine Hand. Schnurr...");
    }
    if (id === 'solom') {
        cats.solom.mood = 100;
        cats.solom.isSleeping = false;
        log("Solom kommt herüber, setzt sich auf deine Beine und kuschelt auf deinem Schoß. Schnurr...");
    }
    updateUI();
}
function toggleBlanket() {
    haushalt.blanketOn = !haushalt.blanketOn;
    log(`Decke ist jetzt ${haushalt.blanketOn ? 'AUF' : 'NEBEN'} dem Sofa.`);
    updateUI();
}
function playWith(id) {
    const toy = document.getElementById('toy-select').value;
    let success = false;
    let c = cats[id];
    c.isSleeping = false;

    if (id === 'david') {
        if (toy === 'karton') {
            success = true;
            log("David springt in den Karton. Nur die Augen gucken raus!");
            c.mood = 100;
            handlePlayEffects('david', 8);
            setTemporaryVisualState('david', 'karton', 3500);
        }
        else if (toy === 'kaefer') {
            success = true;
            log("David schaut dem Käfer zu. Er bewegt sich kaum, aber ist animiert.");
            c.activity += 20;
            handlePlayEffects('david', 10);
            setTemporaryVisualState('david', 'spielt', 2500);
        }
        else if (Math.random() < c.playChance) {
            success = true;
            log("Unglaublich! David spielt kurz mit.");
            c.activity += 50;
            handlePlayEffects('david', 20);
            setTemporaryVisualState('david', 'spielt', 2500);
        }
        else {
            log("David gähnt und ignoriert das Spielzeug.");
            c.mood = Math.max(0, c.mood - 5);
        }
    }

    if (id === 'solom') {
        if (toy === 'laser') {
            success = true;
            log("Solom flitzt wie verrückt dem Laser hinterher!");
            c.activity += 80;
            handlePlayEffects('solom', 40);
            setTemporaryVisualState('solom', 'spielt', 2500);
        }
        else if (toy === 'stab') {
            success = true;
            log("Solom springt nach dem Stab!");
            c.activity += 50;
            handlePlayEffects('solom', 20);
            setTemporaryVisualState('solom', 'spielt', 2500);
        }
        else if (toy === 'minze') {
            success = true;
            log("Solom ist am Kratzbaum beschäftigt.");
            haushalt.scratchPost = Math.max(0, haushalt.scratchPost - 10);
            handlePlayEffects('solom', 12);
            setTemporaryVisualState('solom', 'spielt', 2500);
        }
        else {
            success = true;
            log("Solom spielt fröhlich.");
            c.activity += 30;
            handlePlayEffects('solom', 15);
            setTemporaryVisualState('solom', 'spielt', 2500);
        }
    }

    if (toy === 'baldrian' && success) {
        c.mood = 100;
        setTimeout(() => {
            c.isSleeping = true;
            log(`${c.name} ist vom Baldrian eingeschlafen.`);
            updateUI();
        }, 2000);
    }

    if (toy === 'laser' && id === 'solom') {
        log("David guckt genervt beim Laser-Spiel zu...");
        cats.david.mood = Math.max(0, cats.david.mood - 15);
        setTemporaryVisualState('david', 'sauer', 2500);
    }

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
    document.getElementById('ui-blanket').innerText = haushalt.blanketOn ? "LIEGT (Sicher)" : "FEHLT (Gefahr!)";
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
        let statusText = c.isSleeping ? "Schläft tief und fest 💤" : "Ist wach und schaut sich um 👀";
        let sprite = c.isSleeping ? (id==='david' ? '😴' : '💤') : (id==='david' ? '🐈' : '🐈‍⬛');
        const visualState = getVisualState(id);
        if (c.hunger < 30) {
            statusText = "Miaut laut vor Hunger! 😾";
            sprite = '🙀';
        }
        else if (c.mood < 30) {
            statusText = "Ist schlecht gelaunt.";
            sprite = '😾';
        }
        if(id === 'solom' && (game.hour >= 22 || game.hour < 5) && !c.isSleeping) {
            statusText = "Nachtaktiv! Zoomies! ⚡";
            sprite = '🐆';
        }
        document.getElementById(`status-${id}`).innerText = statusText;
        renderCatSprite(id, visualState, sprite);
    });
}
// Init
updateUI();
startGame();
