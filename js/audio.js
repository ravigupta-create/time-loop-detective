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
            case 'evidence': playEvidenceSound(); break;
            case 'click': playClick(); break;
            case 'notebook_open': playNotebookOpen(); break;
            case 'notebook_close': playNotebookClose(); break;
            case 'clink': playClink(); break;
            case 'loop_reset': playLoopReset(); break;
            case 'accusation': playAccusation(); break;
            case 'typewriter': playTypewriter(); break;
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

    // ── Toggle ──
    function toggle() {
        enabled = !enabled;
        if (!enabled) stopAmbience();
        return enabled;
    }

    return {
        init, resume, startAmbience, stopAmbience,
        playSound, toggle, get enabled() { return enabled; },
    };
})();
