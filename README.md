![GitHub All Releases](https://img.shields.io/github/downloads/ardittristan/HookMacros/total)
[![Donate](https://img.shields.io/badge/Donate-PayPal-Green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=TF3LJHWV9U7HN)

# VTT Hook Macros

*Advanced Scripting Module*

This module allows you to set macros to run when a particular Hook is sent by Foundry VTT.

## Installation

To install, import this [Manifest](https://raw.githubusercontent.com/ardittristan/HookMacros/master/module.json) into your module browser.

## How to use

1. Open either `Settings` or `Local settings` in the module's configuration
   1. `Settings` will run for every user and can only be configured by a GM
   2. `Local settings` are saved as local settings, will only run for the respective user, and can be used by any user
2. Enter data:
   1. `Hook name` (required): The name of the hook to run the macro for. You can run `CONFIG.debug.hooks = true` in the Developer Console of your browser to learn about which hooks get triggered by certain interactions
   2. `Macro ID` (required): The UUID of the macro to run. You can find a macro's UUID by opening the macro editor and clicking on the passport icon in the window's title bar. A message stating "Macro UUID ... copied to clipboard." should pop up.
   3. `Macro args` (optional): Specify any arguments the macro might consume. The pattern is `key1=value1, key2=value2, ...`. Any surrounding spaces will be stripped, so `key1 = value1` is the same as `key1=value1`.
3. Press the `+` button and `Save`

You can then access the arguments in the macro using the `arguments` parameter:

* `arguments[4]` contains the specified arguments as key-value pairs, as well as the hook's arguments as `hookArguments`
* `arguments[5]` through `arguments[n]` contain the argument values without their keys

Example: Configured argument list is `name=John,number=12` and the hook has the arguments `[{name: "Hero"}, {action: "create"}, "uABwxqaeHZHpuK6l"]`
* `arguments[4]` contains `{name: "John", number: "12", hookArguments: [{name: "Hero"}, {action: "create"}, "uABwxqaeHZHpuK6l"]}`
* `arguments[5]` contains `"John"`
* `arguments[6]` contains `"12"`
* `arguments[7]` contains `[{name: "Hero"}, {action: "create"}, "uABwxqaeHZHpuK6l"]`

### Things to watch out for

Don't create macros that run from the chat hook *and* create chat messages that take more than 1 seconds to output to chat.

## Known non-functional hooks

* init

## Changelog

Check the [Changelog](https://github.com/ardittristan/HookMacros/blob/master/CHANGELOG.md)

---

*If you acidentally created a macro that locks you out of the game. You can fix it by holding the END key while logging into your world. This makes the module not run any macros.*
