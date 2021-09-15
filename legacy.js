let journalAvailable = true;
let readyHookArray = [];
let updating = false;
import { hookArray, init, startHookListener, emergency } from "./hookmacro.js";

export default function legacy() {
  game.settings.register("launchmacro", "journalName", {
    name: "Name of the macro journal to use",
    hint: "This is the name of the journal you'll put your macros in. More info in the README.",
    scope: "world",
    config: true,
    default: "Hook Macros",
    type: String,
  });

  Hooks.once("ready", async function () {
    // Init array of already existing macros
    if (!updating) {
      updating = true;
      updateJournal();
    }
    // Start 'ready' hook compability
    checkReady();
    // Start journal watcher
    Hooks.on("createJournalEntry", () => {
      if (!updating) {
        updating = true;
        updateJournal();
        console.log("Updated journal");
      }
    });
    Hooks.on("updateJournalEntry", () => {
      if (!updating) {
        updating = true;
        updateJournal();
        console.log("Updated journal");
      }
    });
    Hooks.on("deleteJournalEntry", () => {
      if (!updating) {
        updating = true;
        updateJournal();
        console.log("Updated journal");
      }
    });
  });
}

/**
 * Gets run at start and when a journal gets updated
 */
async function updateJournal() {
  // Get the right journal
  const journal = game.journal.getName(game.settings.get("launchmacro", "journalName") || "Hook Macros");
  if (journal == undefined) {
    journalAvailable = false;
    console.error(`Journal ${game.settings.get("launchmacro", "journalName")} not found!`);
  }

  if (!journalAvailable) {
    updating = false;
    init = true;
    return;
  }

  /** @type {String[]} */
  // Split journal by line
  let journalLines = journal.data.content.split("\n");
  journalLines.forEach(async (lineContent) => {
    // Check if line contains both an @Hook and @Macro entry
    if (ciIncludes(lineContent, "@Hook[") && ciIncludes(lineContent, "@Macro[")) {
      try {
        let isReadyHook = false;
        // Extract hook name
        let hook = lineContent.match(/(@Hook\[[^[]+\])/gi)[0].match(/(?<=\[)([^[]+)(?=\])+?/gi)[0];
        if (hook.toUpperCase() === "READY") {
          isReadyHook = true;
        }
        if (hookArray[hook] === undefined) {
          hookArray[hook] = [];
        }

        // Extract macro names, multiple possible
        lineContent.match(/(@Macro\[[^\[]+\](\([^\)]*\))?)/gi).forEach(async (unfiltredMacro) => {
          let macro = unfiltredMacro.match(/(?<=\[)([^[]+)(?=\])+?/gi)[0];
          let argsRawArr = unfiltredMacro.match(/(?<=\()([^(]+)(?=\))+?/gi);
          let argsRaw = "";
          let args = [];
          if (argsRawArr !== null) {
            argsRaw = argsRawArr[0];
            args = argsRaw.split(",").map((x) => x.trim());
          }
          if (!hookArray[hook].includes(macro + argsRaw)) {
            // Push into array of processed macros
            hookArray[hook].push(macro + argsRaw);
            if (isReadyHook) {
              readyHookArray.push([macro, args]);
            }
            // Check exceptions
            if (hook.toUpperCase() != "ready".toUpperCase()) {
              console.log(`starting hook listener hook: ${hook}, macro: ${macro}`);
              startHookListener(hook, macro, args, argsRaw);
            }
          }
        });
      } catch (err) {
        console.error("Something went wrong while trying to read the journal.");
      }
    }
  });
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
 * Checks if initialization is done
 */
async function checkReady() {
  // Add timeout for less load
  let timeout = false;
  let running = true;
  // If ready takes more than 15 seconds, skip
  setTimeout(() => {
    if (!init) {
      (running = false), console.error("Skipped ready compat");
    }
  }, 15000);
  while (running) {
    if (!timeout) {
      timeout = true;
      if (init) {
        Ready();
        return;
      }
      setTimeout(() => {
        timeout = false;
      }, 500);
    }
  }
}

/**
 * Runs when initialization of module is done
 */
function Ready() {
  setTimeout(() => {
    startup = false;
  }, 30000);
  if (readyHookArray.length !== 0) {
    readyHookArray.forEach(([macro, args]) => {
      // Emergency stop
      if (emergency) {
        return;
      }
      // Run macro
      let filteredMacro = game.macros.filter((m) => m.name === macro)[0];
      if (filteredMacro === undefined) {
        console.error(`macro "${macro}" doesn't exist`);
      } else {
        console.log(`running macro ${macro} from hook: ready`);
        filteredMacro.execute(...args);
      }
    });
  }
}
