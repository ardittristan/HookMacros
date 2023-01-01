import legacy from "./legacy.js";

// Global variables
export let hookArray = { _: [] };
export let init = false;
/** @type {Handlebars.Template} */
let settingsEntry;
let startup = true;
export let emergency = false;

function emergencyEvent(event) {
  if (event.key === "End" && startup && !emergency) {
    emergency = true;
    console.error("Emergency mode enabled! Hook macros stopped running.");
  }
}

Hooks.once("init", async function () {
  window.addEventListener("keydown", emergencyEvent);

  setTimeout(() => {
    window.removeEventListener("keydown", emergencyEvent);
  }, 60000);

  (async () => {
    settingsEntry = await getTemplate("modules/launchmacro/templates/partials/settingsEntry.html");
  })();

  game.settings.register("launchmacro", "useLegacy", {
    name: "hookMacro.legacy",
    hint: "hookMacro.legacyLabel",
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
  });

  game.settings.register("launchmacro", "savedHooks", {
    scope: "world",
    config: false,
    default: [],
    type: Array,
  });

  game.settings.register("launchmacro", "localSavedHooks", {
    scope: "client",
    config: false,
    default: [],
    type: Array,
  });

  game.settings.registerMenu("launchmacro", "settingsMenu", {
    name: "hookMacro.global",
    label: "hookMacro.label",
    type: HookSettingsApplication,
    restricted: true,
  });

  game.settings.registerMenu("launchmacro", "localSettingsMenu", {
    name: "hookMacro.local",
    label: "hookMacro.label",
    type: LocalHookSettingsApplication,
    restricted: false,
  });

  if (game.settings.get("launchmacro", "useLegacy")) legacy();

  initHookListeners();
  initHookListeners("localSavedHooks");
});

/**
 * inits hooks
 */
function initHookListeners(type = "savedHooks") {
  /** @type {[{id: string, hook: string, macro: string, args: string}]} */
  let hooks = game.settings.get("launchmacro", type) || [];

  hooks.forEach((hook) => {
    if (hookArray[hook.hook] === undefined) hookArray[hook.hook] = [];

    let args = hook.args.split(",");
    if (args.length === 1 && !args[0].length) args = [];

    if (!hookArray[hook.hook].includes(hook.macro + hook.args)) {
      hookArray[hook.hook].push(hook.macro + hook.args);
      console.log(`Hook Macros | starting hook listener hook: ${hook.hook}, macro: ${hook.macro}`);
      startHookListener(hook.hook, hook.macro, args, hook.args);
    }
  });

  init = true;
}

/**
 * Starts a hook listener
 * @param  {String} hook - Hook to listen to
 * @param  {String} macro - Macro to run
 * @param  {Array} args - extra macro options
 */
export async function startHookListener(hook, macro, args, argsRaw = "") {
  // Added spam protection so there's less chance of infinite loops being created
  let lastRan = undefined;
  Hooks.on(hook, (...hookArgs) => {
    if ((lastRan === undefined || lastRan <= Date.now() - 1000) && hookArray[hook].includes(macro + argsRaw)) {
      // Emergency stop
      if (emergency) {
        return;
      }

      // Run macro
      let filteredMacro = game.macros.filter((m) => m.name === macro)[0];
      if (filteredMacro === undefined) {
        console.error(`Hook Macros | macro "${macro}" doesn't exist`);
      } else {
        console.log(`Hook Macros | running macro: ${macro}, from hook: ${hook}`);
        try {
          filteredMacro.execute(...args, ...hookArgs).then(async function () {
            lastRan = Date.now();
          });
        } catch {}
      }
    }
  });
}

class HookSettingsApplication extends FormApplication {
  constructor(object, options) {
    super(object, options);

    this.settingsIdentifier = "savedHooks";
  }

  static get appType() {
    return "global";
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "macro-hooks-settings",
      classes: ["sheet"],
      template: "modules/launchmacro/templates/settingsPopup.html",
      resizable: true,
      minimizable: false,
      title: "hookMacro." + this.appType,
    });
  }

  async getData(options) {
    const data = super.getData(options);
    data.entries = game.settings.get("launchmacro", this.settingsIdentifier) || [];

    return data;
  }

  /**
   * @param {JQuery} html
   */
  activateListeners(html) {
    super.activateListeners(html);

    // cancel button
    html.find("button#cancelButton").on("click", () => {
      this.close();
    });

    // add entry button logic
    html.find("button#addButton").on("click", () => {
      this.addEntry(html);
    });

    html.find("#newEntry input").on("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();

        html.find("#newEntry #addButton").trigger("click");
      }
    });
  }

  /**
   * @param {JQuery} html
   */
  addEntry(html) {
    let hook = html.find("#newEntry-Hook")[0]?.value || "";
    let macro = html.find("#newEntry-Macro")[0]?.value || "";
    let args = html.find("#newEntry-Args")[0]?.value || "";
    let id = randomID();

    let compiledTemplate = settingsEntry({
      hook,
      macro,
      args,
      id,
    });

    html.find("#entryList").append(compiledTemplate);

    html.find("#newEntry-Hook")[0].value = "";
    html.find("#newEntry-Macro")[0].value = "";
    html.find("#newEntry-Args")[0].value = "";
  }

  /**
   * @param {Event} event
   * @param {Object} formData
   */
  async _updateObject(event, formData) {
    let ids = [];
    let settingsArray = [];

    Object.keys(formData).forEach((key) => {
      const id = key.split("-")[0];
      if (!ids.includes(id)) ids.push(id);
    });

    ids.forEach((id) => {
      settingsArray.push({
        id,
        hook: formData[id + "-Hook"],
        macro: formData[id + "-Macro"],
        args: formData[id + "-Args"],
      });
    });

    game.settings.set("launchmacro", this.settingsIdentifier, settingsArray);
  }
}

class LocalHookSettingsApplication extends HookSettingsApplication {
  constructor(object, options) {
    super(object, options);

    this.settingsIdentifier = "localSavedHooks";
  }

  static get appType() {
    return "local";
  }
}
