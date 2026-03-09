/* ═══════════════════════════════════════════════════════
   MAIN — Entry point, initialization
   Midnight at Ravenholm — A Time Loop Detective Game
   ═══════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // Initialize all modules when DOM is ready
    function boot() {
        console.log('%c🔍 Midnight at Ravenholm', 'color: #d4a020; font-size: 20px; font-weight: bold');
        console.log('%cA Time Loop Detective Game', 'color: #6a6a80; font-size: 12px');
        console.log('%c100%% Free — No Ads — No Tracking — No Dependencies', 'color: #555; font-size: 10px');

        // Initialize modules in order
        Renderer.init();
        Engine.init();
        World.init();
        NPCs.init();
        Dialogue.init();
        Mystery.init();
        Notebook.init();
        UI.init();

        // Start the title screen render loop
        Renderer.startLoop();

        // Make UI.onEvidenceToggle accessible globally
        window.UI = UI;

        console.log('Game initialized. All systems ready.');
    }

    // Boot when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
