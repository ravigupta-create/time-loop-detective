/* ═══════════════════════════════════════════════════════
   AUDIO — Procedural Web Audio atmospheric sound
   Rain, thunder, clock, fire, piano, UI sounds
   ═══════════════════════════════════════════════════════ */

const Audio = (() => {
    let ctx = null;
    let masterGain = null;
    let ambienceGain = null;
    let sfxGain = null;
    let musicGain = null;
    let currentAmbience = null;
    let ambienceNodes = [];
    let enabled = true;
    let initialized = false;

    function init() {
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = ctx.createGain();
            masterGain.gain.value = 0.4;
            masterGain.connect(ctx.destination);

            ambienceGain = ctx.createGain();
            ambienceGain.gain.value = 0.3;
            ambienceGain.connect(masterGain);

            sfxGain = ctx.createGain();
            sfxGain.gain.value = 0.5;
            sfxGain.connect(masterGain);

            musicGain = ctx.createGain();
            musicGain.gain.value = 0.15;
            musicGain.connect(masterGain);

            initialized = true;
        } catch (e) {
            enabled = false;
        }
    }

    function resume() {
        if (ctx && ctx.state === 'suspended') ctx.resume();
    }

    // ── Noise Generator ──
    function createNoiseBuffer(seconds, type) {
        const length = ctx.sampleRate * seconds;
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        if (type === 'white') {
            for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
        } else if (type === 'brown') {
            let last = 0;
            for (let i = 0; i < length; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (last + 0.02 * white) / 1.02;
                last = data[i];
                data[i] *= 3.5;
            }
        } else if (type === 'pink') {
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < length; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                b6 = white * 0.115926;
            }
        }
        return buffer;
    }

    // ── Ambience Systems ──
    function stopAmbience() {
        ambienceNodes.forEach(n => {
            try {
                if (n.stop) n.stop();
                if (n.disconnect) n.disconnect();
            } catch (e) {}
        });
        ambienceNodes = [];
        currentAmbience = null;
    }

    function startAmbience(type) {
        if (!initialized || !enabled) return;
        if (currentAmbience === type) return;
        resume();
        stopAmbience();
        currentAmbience = type;

        switch (type) {
            case 'rain': startRain(); break;
            case 'clock_ticking': startClock(); startRainSoft(); break;
            case 'fire': startFire(); startRainSoft(); break;
            case 'candles': startCandles(); startRainSoft(); break;
            case 'kitchen': startKitchen(); startRainSoft(); break;
            case 'study': startStudy(); break;
            case 'piano': startPianoAmbience(); startRainSoft(); break;
            case 'ballroom': startBallroom(); break;
            case 'garden': startGarden(); break;
            case 'cellar': startCellar(); break;
            case 'tower': startTower(); break;
            default: startRainSoft(); break;
        }

        // Sync music tension with current game time
        try {
            if (typeof Engine !== 'undefined' && Engine.state) {
                updateMusicTension(Engine.state.time);
            }
        } catch (e) {}
    }

    function startRain() {
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer(4, 'pink');
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        const gain = ctx.createGain();
        gain.gain.value = 0.4;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ambienceGain);
        noise.start();
        ambienceNodes.push(noise);

        // Occasional thunder
        scheduleThunder();
    }

    function startRainSoft() {
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer(4, 'pink');
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;

        const gain = ctx.createGain();
        gain.gain.value = 0.12;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ambienceGain);
        noise.start();
        ambienceNodes.push(noise);
    }

    function scheduleThunder() {
        if (currentAmbience !== 'rain' && currentAmbience !== 'garden') return;
        const delay = 8000 + Math.random() * 20000;
        setTimeout(() => {
            if (currentAmbience === 'rain' || currentAmbience === 'garden') {
                playThunder();
                scheduleThunder();
            }
        }, delay);
    }

    function playThunder() {
        if (!initialized) return;
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer(3, 'brown');

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.5);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ambienceGain);
        noise.start();
        noise.stop(ctx.currentTime + 3);
    }

    function startClock() {
        // Ticking sound using oscillator clicks
        const tick = () => {
            if (currentAmbience !== 'clock_ticking') return;
            const osc = ctx.createOscillator();
            osc.frequency.value = 800;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(ambienceGain);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
            setTimeout(tick, 1000);
        };
        setTimeout(tick, 500);
    }

    function startFire() {
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer(3, 'brown');
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 0.5;

        const gain = ctx.createGain();
        gain.gain.value = 0.2;

        // Crackling LFO
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 3 + Math.random() * 5;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.08;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ambienceGain);
        noise.start();
        ambienceNodes.push(noise, lfo);
    }

    function startCandles() {
        // Very subtle crackling
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer(2, 'white');
        noise.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        const gain = ctx.createGain();
        gain.gain.value = 0.03;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ambienceGain);
        noise.start();
        ambienceNodes.push(noise);
    }

    function startKitchen() {
        // Low hum + occasional clinks
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 60;
        const gain = ctx.createGain();
        gain.gain.value = 0.05;
        osc.connect(gain);
        gain.connect(ambienceGain);
        osc.start();
        ambienceNodes.push(osc);
    }

    function startStudy() {
        // Clock ticking + muffled rain
        startClock();
        startRainSoft();
    }

    function startPianoAmbience() {
        // Occasional soft piano notes
        const playNote = () => {
            if (currentAmbience !== 'piano') return;
            const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
            const freq = notes[Math.floor(Math.random() * notes.length)];
            playPianoNote(freq, 0.06);
            setTimeout(playNote, 2000 + Math.random() * 4000);
        };
        setTimeout(playNote, 1000);
    }

    function playPianoNote(freq, volume) {
        if (!initialized) return;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 2;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);

        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

        osc.connect(gain);
        osc2.connect(gain2);
        gain.connect(ambienceGain);
        gain2.connect(ambienceGain);
        osc.start();
        osc2.start();
        osc.stop(ctx.currentTime + 2.5);
        osc2.stop(ctx.currentTime + 2);
    }

    function startBallroom() {
        // Murmur of crowd + music
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer(4, 'pink');
        noise.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 300;
        filter.Q.value = 1;
        const gain = ctx.createGain();
        gain.gain.value = 0.1;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ambienceGain);
        noise.start();
        ambienceNodes.push(noise);

        // Occasional glass clink
        const clink = () => {
            if (currentAmbience !== 'ballroom') return;
            playSound('clink');
            setTimeout(clink, 5000 + Math.random() * 10000);
        };
        setTimeout(clink, 3000);
    }

    function startGarden() {
        startRain();
        // Wind
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer(4, 'brown');
        noise.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        const gain = ctx.createGain();
        gain.gain.value = 0.15;

        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.2;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.1;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ambienceGain);
        noise.start();
        ambienceNodes.push(noise, lfo);
    }

    function startCellar() {
        // Deep drone + dripping
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 40;
        const gain = ctx.createGain();
        gain.gain.value = 0.08;
        osc.connect(gain);
        gain.connect(ambienceGain);
        osc.start();
        ambienceNodes.push(osc);

        // Dripping
        const drip = () => {
            if (currentAmbience !== 'cellar') return;
            const o = ctx.createOscillator();
            o.frequency.value = 1200 + Math.random() * 800;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.08, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            o.connect(g);
            g.connect(ambienceGain);
            o.start();
            o.stop(ctx.currentTime + 0.15);
            setTimeout(drip, 2000 + Math.random() * 5000);
        };
        setTimeout(drip, 1000);
    }

    function startTower() {
        // Eerie hum + wind
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 55;
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 55.5; // slight detuning for beating

        const gain = ctx.createGain();
        gain.gain.value = 0.1;

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ambienceGain);
        osc1.start();
        osc2.start();
        ambienceNodes.push(osc1, osc2);

        // Occasional metallic ping
        const ping = () => {
            if (currentAmbience !== 'tower') return;
            const o = ctx.createOscillator();
            o.type = 'sine';
            o.frequency.value = 2000 + Math.random() * 1000;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.05, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
            o.connect(g);
            g.connect(ambienceGain);
            o.start();
            o.stop(ctx.currentTime + 1);
            setTimeout(ping, 4000 + Math.random() * 8000);
        };
        setTimeout(ping, 2000);
    }

    // ── Sound Effects ──
    function playSound(type) {
        if (!initialized || !enabled) return;
        resume();

        switch (type) {
            case 'footsteps': playFootsteps(); break;
            case 'footsteps_stone': playFootstepsStone(); break;
            case 'footsteps_grass': playFootstepsGrass(); break;
            case 'evidence': playEvidenceSound(); break;
            case 'click': playClick(); break;
            case 'notebook_open': playNotebookOpen(); break;
            case 'notebook_close': playNotebookClose(); break;
            case 'clink': playClink(); break;
            case 'loop_reset': playLoopReset(); break;
            case 'accusation': playAccusation(); break;
            case 'typewriter': playTypewriter(); break;
            case 'door_open': playDoorOpen(); break;
            case 'door_close': playDoorClose(); break;
            case 'clock_chime': playClockChime(); break;
            case 'creak': playCreak(); break;
            case 'key_turn': playKeyTurn(); break;
            case 'paper_rustle': playPaperRustle(); break;
            case 'heartbeat': playHeartbeatSFX(); break;
            case 'whisper': playWhisper(); break;
            case 'glass_break': playGlassBreak(); break;
            case 'achievement': playAchievementSound(); break;
            case 'tension_sting': playTensionSting(); break;
            case 'thunder': playThunder(); break;
            case 'wind_gust': playWindGust(); break;
        }
    }

    function playFootsteps() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const noise = ctx.createBufferSource();
                noise.buffer = createNoiseBuffer(0.1, 'brown');
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 500;
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(sfxGain);
                noise.start();
                noise.stop(ctx.currentTime + 0.1);
            }, i * 200);
        }
    }

    function playEvidenceSound() {
        // Rising tone
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    }

    function playClick() {
        const osc = ctx.createOscillator();
        osc.frequency.value = 600;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    }

    function playNotebookOpen() {
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer(0.2, 'white');
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(sfxGain);
        noise.start();
        noise.stop(ctx.currentTime + 0.2);
    }

    function playNotebookClose() {
        playNotebookOpen(); // same sound
    }

    function playClink() {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 3000 + Math.random() * 1000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }

    function playLoopReset() {
        // Descending tone + noise burst
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 2);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 2);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(sfxGain);
        osc.start();
        osc.stop(ctx.currentTime + 2);
    }

    function playAccusation() {
        // Dramatic chord
        [220, 277.18, 329.63].forEach(f => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = f;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start();
            osc.stop(ctx.currentTime + 2);
        });
    }

    function playTypewriter() {
        const osc = ctx.createOscillator();
        osc.frequency.value = 400 + Math.random() * 200;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.02);
    }

    // ── Enhanced Sound Effects ──

    function playFootstepsStone() {
        // Heavier stone footsteps for cellar/tower
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (!initialized) return;
                const noise = ctx.createBufferSource();
                noise.buffer = createNoiseBuffer(0.15, 'brown');
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 300;
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(sfxGain);
                noise.start();
                noise.stop(ctx.currentTime + 0.15);
            }, i * 250);
        }
    }

    function playFootstepsGrass() {
        // Softer grass/gravel footsteps for garden
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                if (!initialized) return;
                const noise = ctx.createBufferSource();
                noise.buffer = createNoiseBuffer(0.08, 'white');
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 2000;
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(sfxGain);
                noise.start();
                noise.stop(ctx.currentTime + 0.08);
            }, i * 180);
        }
    }

    function playDoorOpen() {
        if (!initialized) return;
        // Creaky door opening: descending filtered noise + hinge squeak
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer(0.5, 'brown');
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.4);
        filter.Q.value = 3;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(sfxGain);
        noise.start();
        noise.stop(ctx.currentTime + 0.5);

        // Hinge squeak
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
        osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.3);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0, ctx.currentTime);
        oscGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.15);
        oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(oscGain);
        oscGain.connect(sfxGain);
        osc.start(ctx.currentTime + 0.1);
        osc.stop(ctx.currentTime + 0.4);
    }

    function playDoorClose() {
        if (!initialized) return;
        // Thud
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer(0.2, 'brown');
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 250;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(sfxGain);
        noise.start();
        noise.stop(ctx.currentTime + 0.2);
    }

    function playClockChime() {
        if (!initialized) return;
        // Deep bell tone + harmonics
        const fundamentals = [130.81, 164.81]; // C3, E3
        fundamentals.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const osc2 = ctx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.value = freq * 2.76; // bell partial
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.5);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.5 + 3);
            const gain2 = ctx.createGain();
            gain2.gain.setValueAtTime(0.05, ctx.currentTime + idx * 0.5);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.5 + 2);
            osc.connect(gain);
            osc2.connect(gain2);
            gain.connect(sfxGain);
            gain2.connect(sfxGain);
            osc.start(ctx.currentTime + idx * 0.5);
            osc2.start(ctx.currentTime + idx * 0.5);
            osc.stop(ctx.currentTime + idx * 0.5 + 3.5);
            osc2.stop(ctx.currentTime + idx * 0.5 + 2.5);
        });
    }

    function playCreak() {
        if (!initialized) return;
        // Floorboard creak
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200 + Math.random() * 100, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(150 + Math.random() * 50, ctx.currentTime + 0.3);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 5;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(sfxGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }

    function playKeyTurn() {
        if (!initialized) return;
        // Metallic click sequence
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (!initialized) return;
                const osc = ctx.createOscillator();
                osc.frequency.value = 1500 + i * 300;
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
                osc.connect(gain);
                gain.connect(sfxGain);
                osc.start();
                osc.stop(ctx.currentTime + 0.04);
            }, i * 80);
        }
    }

    function playPaperRustle() {
        if (!initialized) return;
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer(0.15, 'white');
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 3000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(sfxGain);
        noise.start();
        noise.stop(ctx.currentTime + 0.15);
    }

    function playHeartbeatSFX() {
        if (!initialized) return;
        // Single heartbeat thump
        [0, 120].forEach(delay => {
            setTimeout(() => {
                if (!initialized) return;
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(70, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(delay === 0 ? 0.15 : 0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 100;
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(sfxGain);
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            }, delay);
        });
    }

    function playWhisper() {
        if (!initialized) return;
        // Eerie whisper-like filtered noise
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer(1, 'white');
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1500 + Math.random() * 1000;
        bp.Q.value = 8;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.2);
        gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
        noise.connect(bp);
        bp.connect(gain);
        gain.connect(sfxGain);
        noise.start();
        noise.stop(ctx.currentTime + 1);
    }

    function playGlassBreak() {
        if (!initialized) return;
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer(0.3, 'white');
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 4000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        noise.connect(hp);
        hp.connect(gain);
        gain.connect(sfxGain);
        noise.start();
        noise.stop(ctx.currentTime + 0.3);
        // Bright shattering tone
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 5000 + Math.random() * 2000;
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.06, ctx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(oscGain);
        oscGain.connect(sfxGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    }

    function playAchievementSound() {
        if (!initialized) return;
        // Triumphant ascending chord
        const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C5
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + i * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 1.5);
            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(ctx.currentTime + i * 0.1);
            osc.stop(ctx.currentTime + i * 0.1 + 2);
        });
    }

    function playTensionSting() {
        if (!initialized) return;
        // Dramatic dissonant sting for scary moments
        const freqs = [110, 116.54, 233]; // A2, Bb2, Bb3 — tritone
        freqs.forEach(freq => {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 600;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(sfxGain);
            osc.start();
            osc.stop(ctx.currentTime + 1.5);
        });
    }

    function playThunder() {
        if (!initialized) return;
        // Deep rumbling thunder — brown noise through lowpass with volume swell
        const bufferSize = ctx.sampleRate * 3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let last = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            last = (last + (0.02 * white)) / 1.02;
            data[i] = last * 3.5;
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        filter.Q.value = 0.5;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(sfxGain);
        src.start();
        src.stop(ctx.currentTime + 3);
    }

    function playWindGust() {
        if (!initialized) return;
        // Howling wind gust — bandpass filtered noise sweep
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300, ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.5);
        filter.frequency.linearRampToValueAtTime(200, ctx.currentTime + 1.8);
        filter.Q.value = 2;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.3);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 1.8);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ambienceGain);
        src.start();
        src.stop(ctx.currentTime + 2);
    }

    // ═══════════════════════════════════════════════════════
    // PROCEDURAL BACKGROUND MUSIC — Noir Jazz System
    // ═══════════════════════════════════════════════════════

    let currentIntensity = null;   // 'calm', 'investigating', 'tense', 'climax'
    let musicIntervals = [];       // setInterval IDs
    let musicTimeouts = [];        // setTimeout IDs
    let musicOscillators = [];     // active oscillator/node refs for cleanup
    let droneOsc = null;           // persistent low drone for late-night tension
    let heartbeatInterval = null;  // heartbeat pulse interval ID
    let tremoloNodes = [];         // tremolo string nodes for late-night
    let cymbalInterval = null;     // brushed cymbal pattern interval ID
    let currentGameTime = 720;     // cached game time for tension calculations

    // ── Jazz Chord Tones ──
    // Frequencies for jazz chord progressions in C minor
    // Cm7: C Eb G Bb   |   Fm7: F Ab C Eb   |   G7: G B D F
    // Ab∆7: Ab C Eb G  |   Dm7b5: D F Ab C  |   Bdim7: B D F Ab
    const JAZZ_BASS_NOTES = {
        // Walking bass patterns: root notes for chord changes (octave 2-3)
        Cm7:   [65.41, 77.78, 98.00, 116.54],   // C2, Eb2, G2, Bb2
        Fm7:   [87.31, 103.83, 130.81, 155.56],  // F2, Ab2, C3, Eb3
        G7:    [98.00, 123.47, 146.83, 174.61],  // G2, B2, D3, F3
        AbMaj7:[103.83, 130.81, 155.56, 196.00], // Ab2, C3, Eb3, G3
        Dm7b5: [73.42, 87.31, 103.83, 130.81],   // D2, F2, Ab2, C3
        Bdim7: [61.74, 73.42, 87.31, 103.83],    // B1, D2, F2, Ab2
    };
    const CHORD_PROGRESSION = ['Cm7', 'Fm7', 'Cm7', 'G7', 'AbMaj7', 'Fm7', 'Dm7b5', 'G7'];

    // Mid-range chord voicing frequencies
    const JAZZ_CHORDS = {
        Cm7:   [261.63, 311.13, 392.00, 466.16],  // C4, Eb4, G4, Bb4
        Fm7:   [349.23, 415.30, 523.25, 622.25],  // F4, Ab4, C5, Eb5
        G7:    [392.00, 493.88, 587.33, 698.46],  // G4, B4, D5, F5
        AbMaj7:[415.30, 523.25, 622.25, 783.99],  // Ab4, C5, Eb5, G5
        Dm7b5: [293.66, 349.23, 415.30, 523.25],  // D4, F4, Ab4, C5
        Bdim7: [246.94, 293.66, 349.23, 415.30],  // B3, D4, F4, Ab4
    };

    // Trumpet melody note pool (C minor pentatonic + blue notes, octave 4-5)
    const TRUMPET_NOTES = [
        261.63, 311.13, 349.23, 392.00, 466.16,   // C4, Eb4, F4, G4, Bb4
        523.25, 622.25, 698.46, 783.99,            // C5, Eb5, F5, G5
        369.99,                                     // F#4 (blue note)
    ];

    // Short melodic phrase patterns (index offsets into TRUMPET_NOTES)
    const TRUMPET_PHRASES = [
        [0, 2, 4, 3],       // C F Bb G — ascending, falling back
        [4, 3, 1, 0],       // Bb G Eb C — descending
        [2, 3, 4, 5],       // F G Bb C5 — climbing
        [5, 4, 3, 1],       // C5 Bb G Eb — high descent
        [0, 9, 2, 3],       // C F# F G — blue note phrase
        [3, 4, 5, 7],       // G Bb C5 F5 — upward reach
        [7, 5, 4, 3, 1],    // F5 C5 Bb G Eb — long descent
        [1, 3, 4, 3],       // Eb G Bb G — arch shape
    ];

    // Intensity configurations
    const INTENSITY_CONFIG = {
        calm:          { bassInterval: 1100, chordMinDelay: 5000, chordMaxDelay: 12000, trumpetMinDelay: 6000, trumpetMaxDelay: 14000, cymbalInterval: 600, bassVol: 0.07, chordVol: 0.04, trumpetVol: 0.03, cymbalVol: 0.015, stringsVol: 0 },
        investigating: { bassInterval: 800,  chordMinDelay: 3000, chordMaxDelay: 8000,  trumpetMinDelay: 4000, trumpetMaxDelay: 10000, cymbalInterval: 500, bassVol: 0.12, chordVol: 0.06, trumpetVol: 0.04, cymbalVol: 0.02,  stringsVol: 0 },
        tense:         { bassInterval: 600,  chordMinDelay: 2000, chordMaxDelay: 5000,  trumpetMinDelay: 3000, trumpetMaxDelay: 7000,  cymbalInterval: 400, bassVol: 0.14, chordVol: 0.07, trumpetVol: 0.05, cymbalVol: 0.025, stringsVol: 0.04 },
        climax:        { bassInterval: 450,  chordMinDelay: 1500, chordMaxDelay: 3500,  trumpetMinDelay: 2000, trumpetMaxDelay: 5000,  cymbalInterval: 300, bassVol: 0.16, chordVol: 0.09, trumpetVol: 0.06, cymbalVol: 0.03,  stringsVol: 0.06 },
    };

    // ── Start Music ──
    function startMusic(intensity) {
        if (!initialized || !enabled) return;
        if (currentIntensity === intensity) return;
        resume();
        stopMusic();
        currentIntensity = intensity;

        const config = INTENSITY_CONFIG[intensity] || INTENSITY_CONFIG.investigating;

        // ── Walking Bass Line (sine oscillator cycling through jazz chord tones) ──
        let chordIndex = 0;
        let noteInChord = 0;
        const bassId = setInterval(() => {
            if (!currentIntensity) return;
            const cfg = getTensionConfig();
            const chordName = CHORD_PROGRESSION[chordIndex % CHORD_PROGRESSION.length];
            const bassNotes = JAZZ_BASS_NOTES[chordName];
            playBassNote(bassNotes[noteInChord % bassNotes.length], cfg);
            noteInChord++;
            if (noteInChord >= bassNotes.length) {
                noteInChord = 0;
                chordIndex = (chordIndex + 1) % CHORD_PROGRESSION.length;
            }
        }, config.bassInterval);
        musicIntervals.push(bassId);

        // ── Sparse Jazz Chords ──
        scheduleNextChord(config, 0);

        // ── Muted Trumpet Melody (triangle wave with gentle vibrato) ──
        scheduleNextTrumpetPhrase(config);

        // ── Soft Brushed Cymbal Pattern (filtered noise, periodic hits) ──
        startCymbalPattern(config);

        // ── Tension layers (strings, heartbeat) based on current time ──
        applyTimeTensionLayers(config);
    }

    // ── Stop Music ──
    function stopMusic() {
        currentIntensity = null;

        // Clear all intervals
        musicIntervals.forEach(id => clearInterval(id));
        musicIntervals = [];

        // Clear cymbal interval
        if (cymbalInterval !== null) {
            clearInterval(cymbalInterval);
            cymbalInterval = null;
        }

        // Clear heartbeat interval
        if (heartbeatInterval !== null) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }

        // Clear all timeouts
        musicTimeouts.forEach(id => clearTimeout(id));
        musicTimeouts = [];

        // Stop and disconnect any lingering oscillators
        musicOscillators.forEach(node => {
            try {
                if (node.stop) node.stop();
                if (node.disconnect) node.disconnect();
            } catch (e) {}
        });
        musicOscillators = [];

        // Stop tremolo string nodes
        tremoloNodes.forEach(node => {
            try {
                if (node.stop) node.stop();
                if (node.disconnect) node.disconnect();
            } catch (e) {}
        });
        tremoloNodes = [];

        // Kill drone if active
        if (droneOsc) {
            try { droneOsc.stop(); droneOsc.disconnect(); } catch (e) {}
            droneOsc = null;
        }
    }

    // ── Update Music Tension (called externally with game time in minutes) ──
    function updateMusicTension(gameTime) {
        if (!initialized || !enabled) return;
        currentGameTime = gameTime;

        // Auto-escalate intensity based on time thresholds
        if (!currentIntensity) return;

        // Apply time-based tension layers dynamically
        const cfg = getTensionConfig();
        applyTimeTensionLayers(cfg);
    }

    // ── Get Tension-Adapted Config ──
    function getTensionConfig() {
        const base = INTENSITY_CONFIG[currentIntensity] || INTENSITY_CONFIG.investigating;
        let time = currentGameTime;
        try { if (typeof Engine !== 'undefined' && Engine.state) time = Engine.state.time; } catch (e) {}

        // Progress: 0 at 6AM (360), 1 at midnight (1440)
        const progress = Math.max(0, Math.min(1, (time - 360) / (1440 - 360)));

        // Adapt bass interval: gets faster as night falls
        const tempoFactor = 1 - progress * 0.25;
        const bassInterval = Math.round(base.bassInterval * tempoFactor);

        // Adapt volumes: bass gets louder, chords get more present
        const bassVol = base.bassVol + progress * 0.04;
        const chordVol = base.chordVol + progress * 0.03;
        const trumpetVol = base.trumpetVol + progress * 0.02;

        // Dissonance factor: higher = more minor seconds, diminished chords
        const dissonance = progress;

        // Strings creep in during later hours
        let stringsVol = base.stringsVol;
        if ((currentIntensity === 'investigating' || currentIntensity === 'calm') && progress > 0.6) {
            stringsVol = (progress - 0.6) * 0.08;
        }

        // Low drone starts after ~9PM
        const droneFactor = progress > 0.55 ? (progress - 0.55) / 0.45 : 0;

        // Tension thresholds (game time in minutes from midnight)
        const after10PM = time >= 1320;   // 22:00
        const after11PM = time >= 1380;   // 23:00
        const after1130PM = time >= 1410; // 23:30

        return {
            ...base, bassInterval, bassVol, chordVol, trumpetVol,
            dissonance, stringsVol, droneFactor, progress,
            after10PM, after11PM, after1130PM, time
        };
    }

    // ── Walking Bass Note ──
    function playBassNote(freq, cfg) {
        if (!initialized || !currentIntensity) return;
        const t = ctx.currentTime;

        let noteFreq = freq;

        // After 10PM: occasional minor second intervals (dissonant)
        if (cfg.after10PM && Math.random() < 0.25) {
            // Add a minor second above (semitone = freq * 2^(1/12))
            const minorSecond = noteFreq * Math.pow(2, 1/12);
            playDissonantBassLayer(minorSecond, cfg.bassVol * 0.3, t);
        }

        // Slight chromatic micro-detune for unease at high dissonance
        if (cfg.dissonance > 0.5 && Math.random() < 0.2) {
            noteFreq *= (1 + (Math.random() * 0.03 - 0.015));
        }

        // Fundamental (sine for deep warmth)
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = noteFreq;

        // Soft overtone for definition
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.value = noteFreq * 2;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(cfg.bassVol, t);
        gain.gain.exponentialRampToValueAtTime(cfg.bassVol * 0.6, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(cfg.bassVol * 0.15, t);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        // Low-pass to keep it warm
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;

        osc.connect(filter);
        osc2.connect(gain2);
        filter.connect(gain);
        gain.connect(musicGain);
        gain2.connect(musicGain);
        osc.start(t);
        osc2.start(t);
        osc.stop(t + 0.8);
        osc2.stop(t + 0.6);

        // Manage drone based on time
        manageDrone(cfg);
    }

    // ── Dissonant Minor Second Layer (after 10PM) ──
    function playDissonantBassLayer(freq, vol, t) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 250;
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(musicGain);
        osc.start(t);
        osc.stop(t + 0.6);
    }

    // ── Jazz Chord ──
    function scheduleNextChord(config, chordIdx) {
        if (!currentIntensity) return;
        const delay = config.chordMinDelay + Math.random() * (config.chordMaxDelay - config.chordMinDelay);
        const tid = setTimeout(() => {
            if (!currentIntensity) return;
            const cfg = getTensionConfig();
            const nextIdx = (chordIdx + 1) % CHORD_PROGRESSION.length;
            playNoirChord(cfg, chordIdx);
            scheduleNextChord(cfg, nextIdx);
        }, delay);
        musicTimeouts.push(tid);
    }

    function playNoirChord(cfg, chordIdx) {
        if (!initialized || !currentIntensity) return;
        const t = ctx.currentTime;

        // Select chord from progression, with dissonance-based substitutions
        let chordName = CHORD_PROGRESSION[chordIdx % CHORD_PROGRESSION.length];
        const roll = Math.random();
        if (cfg.dissonance > 0.7 && roll < 0.4) {
            chordName = 'Bdim7';  // diminished substitution
        } else if (cfg.dissonance > 0.4 && roll < 0.3) {
            chordName = 'Dm7b5'; // half-diminished substitution
        }

        const voicing = JAZZ_CHORDS[chordName];
        const chordDuration = currentIntensity === 'calm' ? 4 : 2.5;

        voicing.forEach((freq, i) => {
            let noteFreq = freq;

            // After 10PM: add minor second dissonance to some chord tones
            if (cfg.after10PM && i === 1 && Math.random() < 0.3) {
                noteFreq = freq * Math.pow(2, 1/12); // sharp by a semitone
            }

            // Fundamental
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = noteFreq;

            // Soft harmonic for piano-like timbre
            const osc2 = ctx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.value = noteFreq * 3;

            const gain = ctx.createGain();
            const vol = cfg.chordVol * (1 - i * 0.08);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(vol, t + 0.02);
            gain.gain.setValueAtTime(vol, t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, t + chordDuration);

            const gain2 = ctx.createGain();
            gain2.gain.setValueAtTime(vol * 0.08, t);
            gain2.gain.exponentialRampToValueAtTime(0.001, t + chordDuration * 0.6);

            osc.connect(gain);
            osc2.connect(gain2);
            gain.connect(musicGain);
            gain2.connect(musicGain);
            osc.start(t);
            osc2.start(t);
            osc.stop(t + chordDuration + 0.1);
            osc2.stop(t + chordDuration * 0.7);
        });
    }

    // ── Muted Trumpet Melody (triangle wave with gentle vibrato) ──
    function scheduleNextTrumpetPhrase(config) {
        if (!currentIntensity) return;
        const delay = config.trumpetMinDelay + Math.random() * (config.trumpetMaxDelay - config.trumpetMinDelay);
        const tid = setTimeout(() => {
            if (!currentIntensity) return;
            const cfg = getTensionConfig();
            playTrumpetPhrase(cfg);
            scheduleNextTrumpetPhrase(cfg);
        }, delay);
        musicTimeouts.push(tid);
    }

    function playTrumpetPhrase(cfg) {
        if (!initialized || !currentIntensity) return;

        // Pick a random short phrase
        const phrase = TRUMPET_PHRASES[Math.floor(Math.random() * TRUMPET_PHRASES.length)];
        const noteSpacing = 0.3 + Math.random() * 0.2; // 300-500ms between notes

        phrase.forEach((noteIdx, i) => {
            const startTime = ctx.currentTime + i * noteSpacing;
            const freq = TRUMPET_NOTES[noteIdx % TRUMPET_NOTES.length];
            const noteDuration = 0.25 + Math.random() * 0.15; // 250-400ms per note

            playTrumpetNote(freq, cfg.trumpetVol, startTime, noteDuration, cfg);
        });
    }

    function playTrumpetNote(freq, vol, startTime, duration, cfg) {
        if (!initialized || !currentIntensity) return;

        // Main triangle oscillator (muted trumpet timbre)
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;

        // Gentle vibrato: slow LFO modulating frequency
        const vibrato = ctx.createOscillator();
        vibrato.type = 'sine';
        vibrato.frequency.value = 4.5 + Math.random() * 1.5; // 4.5-6 Hz vibrato rate
        const vibratoGain = ctx.createGain();
        vibratoGain.gain.value = freq * 0.008; // ~0.8% frequency deviation
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);

        // Muting filter: low-pass to simulate a muted trumpet
        const muteFilter = ctx.createBiquadFilter();
        muteFilter.type = 'lowpass';
        muteFilter.frequency.value = 1200;
        muteFilter.Q.value = 1.5;

        // Soft second harmonic for warmth
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 2;

        // Envelope: soft attack, sustain, gentle release
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.04); // soft attack
        gain.gain.setValueAtTime(vol * 0.85, startTime + duration * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0, startTime);
        gain2.gain.linearRampToValueAtTime(vol * 0.12, startTime + 0.04);
        gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.7);

        osc.connect(muteFilter);
        muteFilter.connect(gain);
        osc2.connect(gain2);
        gain.connect(musicGain);
        gain2.connect(musicGain);

        osc.start(startTime);
        vibrato.start(startTime);
        osc2.start(startTime);
        osc.stop(startTime + duration + 0.1);
        vibrato.stop(startTime + duration + 0.1);
        osc2.stop(startTime + duration + 0.1);
    }

    // ── Soft Brushed Cymbal Pattern (filtered noise, periodic hits) ──
    function startCymbalPattern(config) {
        if (cymbalInterval !== null) {
            clearInterval(cymbalInterval);
            cymbalInterval = null;
        }
        // Periodic brush hits
        cymbalInterval = setInterval(() => {
            if (!currentIntensity) return;
            const cfg = getTensionConfig();
            playBrushedCymbal(cfg);
        }, config.cymbalInterval);
        musicIntervals.push(cymbalInterval);
    }

    function playBrushedCymbal(cfg) {
        if (!initialized || !currentIntensity) return;
        const t = ctx.currentTime;

        // Create short burst of filtered white noise (brush stroke)
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer(0.12, 'white');

        // High-pass + band-pass for metallic cymbal character
        const hpFilter = ctx.createBiquadFilter();
        hpFilter.type = 'highpass';
        hpFilter.frequency.value = 6000 + Math.random() * 2000;

        const bpFilter = ctx.createBiquadFilter();
        bpFilter.type = 'bandpass';
        bpFilter.frequency.value = 8000 + Math.random() * 3000;
        bpFilter.Q.value = 0.8;

        // Soft envelope: quick attack, fast decay
        const gain = ctx.createGain();
        const vol = cfg.cymbalVol * (0.6 + Math.random() * 0.4); // slight variation
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08 + Math.random() * 0.04);

        noise.connect(hpFilter);
        hpFilter.connect(bpFilter);
        bpFilter.connect(gain);
        gain.connect(musicGain);
        noise.start(t);
        noise.stop(t + 0.15);
    }

    // ── Time-Based Tension Layers ──
    function applyTimeTensionLayers(cfg) {
        // After 11PM (>= 1380): Heartbeat-like bass pulse
        if (cfg.after11PM && heartbeatInterval === null) {
            startHeartbeatPulse(cfg);
        } else if (!cfg.after11PM && heartbeatInterval !== null) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }

        // After 11:30PM (>= 1410): Full tension with tremolo strings
        if (cfg.after1130PM && tremoloNodes.length === 0) {
            startTremoloStrings(cfg);
        } else if (!cfg.after1130PM && tremoloNodes.length > 0) {
            tremoloNodes.forEach(node => {
                try { if (node.stop) node.stop(); if (node.disconnect) node.disconnect(); } catch (e) {}
            });
            tremoloNodes = [];
        }

        // Staccato strings for tense/climax or late-night
        if (cfg.stringsVol > 0.01) {
            scheduleStaccatoStrings(cfg);
        }
    }

    // ── Heartbeat Bass Pulse (after 11PM) ──
    function startHeartbeatPulse(cfg) {
        if (heartbeatInterval !== null) return;

        // Double-thump heartbeat pattern: thump-thump ... thump-thump
        const tempo = cfg.after1130PM ? 400 : 500; // faster when closer to midnight
        heartbeatInterval = setInterval(() => {
            if (!currentIntensity) return;
            playHeartbeatThump(0);
            setTimeout(() => {
                if (!currentIntensity) return;
                playHeartbeatThump(1); // second thump, slightly softer
            }, 120);
        }, tempo);
        musicIntervals.push(heartbeatInterval);
    }

    function playHeartbeatThump(beat) {
        if (!initialized || !currentIntensity) return;
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        // Low thump: pitch drops quickly
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);

        const gain = ctx.createGain();
        const vol = beat === 0 ? 0.09 : 0.05; // first beat louder
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 100;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(musicGain);
        osc.start(t);
        osc.stop(t + 0.25);
    }

    // ── Tremolo Strings (after 11:30PM) ──
    function startTremoloStrings(cfg) {
        if (!initialized || !currentIntensity) return;

        // Sustained tremolo on dissonant intervals (minor 2nds and tritones)
        const stringFreqs = [
            311.13,           // Eb4
            329.63,           // E4 (minor 2nd with Eb = maximum tension)
            466.16,           // Bb4
            493.88,           // B4 (minor 2nd with Bb)
        ];

        stringFreqs.forEach(freq => {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;

            // Tremolo LFO: rapid amplitude modulation
            const tremoloLFO = ctx.createOscillator();
            tremoloLFO.type = 'sine';
            tremoloLFO.frequency.value = 8 + Math.random() * 4; // 8-12 Hz tremolo
            const tremoloDepth = ctx.createGain();
            tremoloDepth.gain.value = 0.015; // tremolo depth

            // Base gain
            const gain = ctx.createGain();
            gain.gain.value = 0.02; // very subtle

            // Heavy filtering to soften the sawtooth
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 1500;
            filter.Q.value = 1;

            // Fade in slowly
            const fadeGain = ctx.createGain();
            fadeGain.gain.setValueAtTime(0, ctx.currentTime);
            fadeGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 3);

            tremoloLFO.connect(tremoloDepth);
            tremoloDepth.connect(gain.gain);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(fadeGain);
            fadeGain.connect(musicGain);

            osc.start();
            tremoloLFO.start();

            tremoloNodes.push(osc, tremoloLFO);
            musicOscillators.push(osc, tremoloLFO);
        });
    }

    // ── Staccato Strings (sawtooth, filtered) ──
    function scheduleStaccatoStrings(config) {
        if (!currentIntensity) return;
        const delay = 4000 + Math.random() * 8000;
        const tid = setTimeout(() => {
            if (!currentIntensity) return;
            const cfg = getTensionConfig();
            if (cfg.stringsVol > 0.01) {
                playStaccatoString(cfg);
            }
            scheduleStaccatoStrings(cfg);
        }, delay);
        musicTimeouts.push(tid);
    }

    function playStaccatoString(cfg) {
        if (!initialized || !currentIntensity) return;
        const t = ctx.currentTime;

        const notePool = Object.values(JAZZ_CHORDS).flat();
        const freq = notePool[Math.floor(Math.random() * notePool.length)];

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200 + cfg.dissonance * 800;
        filter.Q.value = 2;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(cfg.stringsVol, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(musicGain);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    // ── Low Drone (builds tension as midnight nears) ──
    function manageDrone(cfg) {
        if (!currentIntensity) return;

        if (cfg.droneFactor > 0 && !droneOsc) {
            droneOsc = ctx.createOscillator();
            droneOsc.type = 'sine';
            droneOsc.frequency.value = 55; // A1 — deep rumble

            const droneFilter = ctx.createBiquadFilter();
            droneFilter.type = 'lowpass';
            droneFilter.frequency.value = 120;

            const droneGainNode = ctx.createGain();
            droneGainNode.gain.value = 0;
            droneGainNode.gain.linearRampToValueAtTime(cfg.droneFactor * 0.06, ctx.currentTime + 2);

            droneOsc.connect(droneFilter);
            droneFilter.connect(droneGainNode);
            droneGainNode.connect(musicGain);
            droneOsc.start();
            droneOsc._gainNode = droneGainNode;
            musicOscillators.push(droneOsc);
        } else if (cfg.droneFactor > 0 && droneOsc && droneOsc._gainNode) {
            try {
                droneOsc._gainNode.gain.linearRampToValueAtTime(
                    cfg.droneFactor * 0.06, ctx.currentTime + 1
                );
            } catch (e) {}
        } else if (cfg.droneFactor <= 0 && droneOsc) {
            try { droneOsc.stop(); droneOsc.disconnect(); } catch (e) {}
            droneOsc = null;
        }
    }

    // ── Toggle ──
    function toggle() {
        enabled = !enabled;
        if (!enabled) {
            stopAmbience();
            stopMusic();
        }
        return enabled;
    }

    function setMasterVolume(v) {
        if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v));
    }

    function setMusicVolume(v) {
        if (musicGain) musicGain.gain.value = Math.max(0, Math.min(0.5, v * 0.5));
    }

    return {
        init, resume, startAmbience, stopAmbience,
        playSound, toggle, startMusic, stopMusic, updateMusicTension,
        setMasterVolume, setMusicVolume,
        get enabled() { return enabled; },
    };
})();
