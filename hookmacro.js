// Global variables
var hookArray = { _: [] };
var updating = false;
var spamProtect = {};
var init = false;
var startup = true;
var emergency = false;
var journalAvailable = true;

Hooks.once('init', async function () {
    // Init settings
    game.settings.register("launchmacro", "journalName", {
        name: "Name of the macro journal to use",
        hint: "This is the name of the journal you'll put your macros in. More info in the README.",
        scope: "world",
        config: true,
        default: "Hook Macros",
        type: String
    });

    window.addEventListener('keydown', (event) => {
        if (event.keyCode === 35 && startup && (!emergency)) {
            emergency = true;
            console.error("Emergency mode enabled! Hook macros stopped running.");

        }
    });
});

Hooks.once('ready', async function () {
    // Init array of already existing macros
    if (!updating) { updating = true; updateJournal(); }
    // Start 'ready' hook compability
    checkReady();
    // Start journal watcher
    Hooks.on('createJournalEntry', () => { if (!updating) { updating = true; updateJournal(); } });
    Hooks.on('updateJournalEntry', () => { if (!updating) { updating = true; updateJournal(); } });
    Hooks.on('deleteJournalEntry', () => { if (!updating) { updating = true; updateJournal(); } });
});

/**
 * Runs when initialization of module is done
 */
function Ready() {
    sleep(30000).then(() => { startup = false; });
    if (hookArray.ready != undefined) {
        hookArray.ready.forEach(macro => {
            if (emergency) { return; }
            console.log(`running macro ready: ${macro}`);
            game.macros.filter(m => m.name === macro)[0].execute();
        });
    }
}

/**
 * Gets run at start and when a journal gets updated
 */
async function updateJournal() {
    // Get the right journal
    var journal = game.journal.entities.filter(j => j.name === (game.settings.get("launchmacro", "journalName") || "Hook Macros"))[0];
    if (journal == undefined) { journalAvailable = false; console.error("Journal not found!")}

    // For whatever reason using return crashes foundry, but using if it works great
    if (journalAvailable) {
        /** @type {String[]} */
        // Split journal by line
        var journalLines = journal.data.content.split("\n");
        journalLines.forEach(async lineContent => {
            // Check if line contains both an @Hook and @Macro entry
            if (ciIncludes(lineContent, "\@Hook\[") && ciIncludes(lineContent, "\@Macro\[")) {
                // Extract hook name
                var hook = lineContent.match(/(@Hook\[[a-z0-9]+\])/gi)[0].match(/(?<=\[)([a-z0-9]+)(?=\])+?/gi)[0];
                if (hookArray[hook] === undefined) { hookArray[hook] = []; }

                // Extract macro names, multiple possible
                lineContent.match(/(@Macro\[[a-z0-9]+\])/gi).forEach(async unfiltredMacro => {
                    var macro = unfiltredMacro.match(/(?<=\[)([a-z0-9]+)(?=\])+?/gi)[0];
                    if (!(hookArray[hook].includes(macro))) {
                        // Push into array of processed macros
                        hookArray[hook].push(macro);
                        // Check exceptions
                        if (hook.toUpperCase() != "ready".toUpperCase()) {
                            console.log(`starting hook listener ${hook}: ${macro}`);
                            startHookListener(hook, macro);
                        }
                    }
                });
            }
        });
    }
    updating = false;
    init = true;
}

/**
 * Includes case insensitive
 * @param  {String} string - Input string
 * @param  {String} includes - Search string
 */
function ciIncludes(string, includes) {
    if (string.toUpperCase().includes(includes.toUpperCase())) {
        return true;
    } else {
        return false;
    }
}

/**
 * Starts a hook listener
 * @param  {String} hook - Hook to listen to
 * @param  {String} macro - Macro to run
 */
async function startHookListener(hook, macro) {
    // Added spam protection so there's less chance of infinite loops being created
    spamProtect[macro] = false;
    Hooks.on(hook, () => {
        if ((!spamProtect[macro]) && hookArray[hook].includes(macro)) {
            spamProtect[macro] = true;
            if (emergency) { return; }
            console.log(`running macro ${hook}: ${macro}`);
            game.macros.filter(m => m.name === macro)[0].execute().then(async function () {
                setTimeout(() => { spamProtect[macro] = false; }, 1000);
            });
        }
    });
}
/**
 * Sleep function
 * @param  {} ms - Amount of miliseconds to sleep
 * @returns Promise
 */
async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
/**
 * Checks if initialization is done
 */
async function checkReady() {
    // Add timeout for less load
    var timeout = false;
    while (true) {
        if (!timeout) {
            timeout = true;
            if (init) {
                Ready();
                return;
            }
            sleep(500).then(() => timeout = false);
        }
    }
}
