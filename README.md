# VTT Hook Macros

This Module allows you to have macros run when hooks broadcast.

## Installation

To install, import this [Manifest](https://raw.githubusercontent.com/ardittristan/HookMacros/master/module.json) into your module browser.

## Usage

Create a journal with the name you put in the module settings. (default: `Hook Macros`)

Then in that journal you can add hooks that you want to trigger macros.

The general input method is:

@Hook[`hook name`] @Macro[`macro name`]

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;The hooks and macro names are case sensitive.

You can have more than one macro on a line, for the same hook, but you can't put multiple hooks on the same line.

## Known non-functional hooks

* init

- - -

*If you acidentally created a macro that locks you out of the game. You can fix it by holding the END key while logging into your world. This makes the module not run any macros.*
