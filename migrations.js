const migrations = {
  legacy: migrateTo3,
  // Once there is a next migration, have the previous one immediately call that one
}

export async function migrate() {
  const targetVersion = getVersion()
  const lastVersion = game.settings.get('launchmacro', 'lastVersion')

  if (lastVersion === targetVersion) {
    return
  }

  if (!migrations[lastVersion]) {
    return
  }

  const migrationTarget =
    lastVersion === 'legacy'
      ? `to &lt;${targetVersion}&gt;`
      : `from &lt;${lastVersion}&gt; to &lt;${targetVersion}&gt;`

  const notification = ui.notifications.info(
    `Hook Macros: Migrating ${migrationTarget}... Please don't exit the game until the migration is done.`,
    { permanent: true },
  )

  await migrations[lastVersion]()

  game.settings.set('launchmacro', 'lastVersion', targetVersion)

  ui.notifications.info(
    `Hook Macros: Migration ${migrationTarget} completed.`,
    { permanent: true },
  )

  notification.remove()
}

// Migrations

// Legacy to 3.0.0

async function migrateTo3() {
  const savedHooks = game.settings.get('launchmacro', 'savedHooks')
  const migratedSavedHooks = useUuidInsteadOfName(savedHooks)
  game.settings.set('launchmacro', 'savedHooks', migratedSavedHooks)

  const localSavedHooks = game.settings.get('launchmacro', 'localSavedHooks')
  const migratedLocalSavedHooks = useUuidInsteadOfName(localSavedHooks)
  game.settings.set('launchmacro', 'localSavedHooks', migratedLocalSavedHooks)
}

function useUuidInsteadOfName(list) {
  return list.map((entry) => {
    const name = entry.macro
    const uuid = game.macros.find((macro) => macro.name === name)?.uuid

    if (!uuid) {
      return null
    }

    return { ...entry, macro: uuid }
  })
}

// Helpers

function getVersion() {
  return game.modules.get('launchmacro').version
}
