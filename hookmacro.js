import legacy from './legacy.js'
import { migrate } from './migrations.js'

// Global variables
export let hookArray = { _: [] }
export let init = false
/** @type {Handlebars.Template} */
let settingsEntry
let startup = true
export let emergency = false

function emergencyEvent(event) {
  if (event.key === 'End' && startup && !emergency) {
    emergency = true
    console.error('Emergency mode enabled! Hook macros stopped running.')
  }
}

Hooks.once('init', async function () {
  window.addEventListener('keydown', emergencyEvent)

  setTimeout(() => {
    window.removeEventListener('keydown', emergencyEvent)
  }, 60000)
  ;(async () => {
    settingsEntry = await getTemplate(
      'modules/launchmacro/templates/partials/settingsEntry.html',
    )
  })()

  game.settings.register('launchmacro', 'useLegacy', {
    name: 'hookMacro.legacy',
    hint: 'hookMacro.legacyLabel',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
  })

  game.settings.register('launchmacro', 'savedHooks', {
    scope: 'world',
    config: false,
    default: [],
    type: Array,
  })

  game.settings.register('launchmacro', 'localSavedHooks', {
    scope: 'client',
    config: false,
    default: [],
    type: Array,
  })

  game.settings.registerMenu('launchmacro', 'settingsMenu', {
    name: 'hookMacro.global',
    label: 'hookMacro.label',
    type: HookSettingsApplication,
    restricted: true,
  })

  game.settings.registerMenu('launchmacro', 'localSettingsMenu', {
    name: 'hookMacro.local',
    label: 'hookMacro.label',
    type: LocalHookSettingsApplication,
    restricted: false,
  })

  if (game.settings.get('launchmacro', 'useLegacy')) {
    legacy()
  }

  game.settings.register('launchmacro', 'lastVersion', {
    scope: 'world',
    config: false,
    default: 'legacy',
    type: String,
  })

  initHookListeners()
  initHookListeners('localSavedHooks')
})

Hooks.once('ready', async () => {
  await migrate()
})

/**
 * inits hooks
 */
function initHookListeners(type = 'savedHooks') {
  /** @type {[{id: string, hook: string, macro: string, args: string}]} */
  let hooks = game.settings.get('launchmacro', type) || []

  hooks.forEach((hook) => {
    if (hookArray[hook.hook] === undefined) {
      hookArray[hook.hook] = []
    }

    // Expected pattern: key1=value1,key2=value2,...
    let args = (hook.args ? hook.args.split(',') : []).reduce((map, entry) => {
      const [key, value] = entry.split('=').map((str) => str.trim())

      return { ...map, [key]: value }
    }, {})

    if (!hookArray[hook.hook].includes(hook.macro + hook.args)) {
      hookArray[hook.hook].push(hook.macro + hook.args)
      console.log(
        `Hook Macros | Starting hook listener hook: ${hook.hook}, macro: ${hook.macro}.`,
      )

      startHookListener(hook.hook, hook.macro, args, hook.args)
    }
  })

  init = true
}

/**
 * Starts a hook listener
 * @param  {String} hook - Hook to listen to
 * @param  {String} macro - Macro to run
 * @param  {Array} args - extra macro options
 */
export async function startHookListener(hook, macro, args, argsRaw = '') {
  // Added spam protection so there's less chance of infinite loops being created
  let lastRan = undefined
  Hooks.on(hook, async (...hookArguments) => {
    if (lastRan !== undefined && lastRan > Date.now() - 1000) {
      // Too early to run again
      return
    }

    if (!hookArray[hook].includes(macro + argsRaw)) {
      // No longer registered as hook macro
      return
    }

    if (emergency) {
      // Emergency stop
      return
    }

    if (!macro.startsWith('Macro.')) {
      console.error(`Hook Macros | Entity "${macro}" is not a macro.`)
      return
    }

    // Run macro
    let filteredMacro = await fromUuid(macro)

    if (filteredMacro === undefined) {
      console.error(`Hook Macros | Macro "${macro}" doesn't exist.`)
      return
    }

    console.log(`Hook Macros | Running macro: ${macro}, from hook: ${hook}.`)

    try {
      console.log(100, 'Hook Macros | ', { args, hookArguments })
      await filteredMacro.execute({ ...args, hookArguments })
      lastRan = Date.now()
    } catch (error) {
      console.error('Hook Macros |', error)
    }
  })
}

class HookSettingsApplication extends FormApplication {
  constructor(object, options) {
    super(object, options)

    this.settingsIdentifier = 'savedHooks'
  }

  static get appType() {
    return 'global'
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: 'macro-hooks-settings',
      classes: ['sheet'],
      template: 'modules/launchmacro/templates/settingsPopup.html',
      resizable: true,
      minimizable: false,
      title: 'hookMacro.' + this.appType,
    })
  }

  async getData(options) {
    const data = super.getData(options)
    data.entries =
      game.settings.get('launchmacro', this.settingsIdentifier) || []

    return data
  }

  /**
   * @param {JQuery} html
   */
  activateListeners(html) {
    super.activateListeners(html)

    // cancel button
    html.find('button#cancelButton').on('click', () => {
      this.close()
    })

    // add entry button logic
    html.find('button#addButton').on('click', () => {
      this.addEntry(html)
    })

    html.find('#newEntry input').on('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()

        html.find('#newEntry #addButton').trigger('click')
      }
    })
  }

  /**
   * @param {JQuery} html
   */
  addEntry(html) {
    let hook = html.find('#newEntry-Hook')[0]?.value || ''
    let macro = html.find('#newEntry-Macro')[0]?.value || ''
    let args = html.find('#newEntry-Args')[0]?.value || ''
    let id = randomID()

    let compiledTemplate = settingsEntry({
      hook,
      macro,
      args,
      id,
    })

    html.find('#entryList').append(compiledTemplate)

    html.find('#newEntry-Hook')[0].value = ''
    html.find('#newEntry-Macro')[0].value = ''
    html.find('#newEntry-Args')[0].value = ''
  }

  /**
   * @param {Event} event
   * @param {Object} formData
   */
  async _updateObject(event, formData) {
    let ids = []
    let settingsArray = []

    Object.keys(formData).forEach((key) => {
      const id = key.split('-')[0]
      if (!ids.includes(id)) ids.push(id)
    })

    ids.forEach((id) => {
      settingsArray.push({
        id,
        hook: formData[id + '-Hook'],
        macro: formData[id + '-Macro'],
        args: formData[id + '-Args'],
      })
    })

    game.settings.set('launchmacro', this.settingsIdentifier, settingsArray)
  }
}

class LocalHookSettingsApplication extends HookSettingsApplication {
  constructor(object, options) {
    super(object, options)

    this.settingsIdentifier = 'localSavedHooks'
  }

  static get appType() {
    return 'local'
  }
}
