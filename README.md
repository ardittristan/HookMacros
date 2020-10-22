![GitHub All Releases](https://img.shields.io/github/downloads/ardittristan/HookMacros/total)
[![Donate](https://img.shields.io/badge/Donate-PayPal-Green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=TF3LJHWV9U7HN)

# VTT Hook Macros

*Advanced Scripting Module*

This module allows you to set macros to run when a particular Hook is sent by Foundry VTT. The hook that acts as a trigger and which macro to use can be configured using a Journal Entry.

## Installation

To install, import this [Manifest](https://raw.githubusercontent.com/ardittristan/HookMacros/master/module.json) into your module browser.

## Usage

Create a journal with the name you put in the module settings. (default: `Hook Macros`)

Then in that journal you can add hooks that you want to trigger macros.

The general input method is:

@Hook[`hook name`] @Macro[`macro name`]

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;The hooks and macro names are case sensitive.

~~You can have more than one macro on a line, for the same hook~~, but you can't put multiple hooks on the same line.  
*ᵐᵘˡᵗⁱᵖˡᵉ ʰᵒᵒᵏˢ ᵒⁿ ᵒⁿᵉ ˡⁱⁿᵉ ᶜᵃⁿ ᶜᵃᵘˢᵉ ʲᵒᵘʳⁿᵃˡ ᶜᵒʳʳᵘᵖᵗⁱᵒⁿ*

*Optionally, if you type @Macro[`macro name`]\(arg1,arg2 ,arg3) you can use args from [The Furnace](https://github.com/kakaroto/fvtt-module-furnace)*

*If you don't know what hook you need, [The Furnace](https://github.com/kakaroto/fvtt-module-furnace) has a handy option that allows you to enable debugging. Which will show hooks in the console when they are called. Open the console with `ctrl + shift + i` or `F12`*

### Things to watch out for

Don't create macros that run from the chat hook *and* create chat messages that take more than 1 seconds to output to chat.

## Known non-functional hooks

* init

## Known issues

* Firefox 77 doesn't support regex lookbehinds and doesn't function as such, please use Firefox Beta 78, or wait until June 30th 2020 for it to release.

## Changelog

Check the [Changelog](https://github.com/ardittristan/HookMacros/blob/master/CHANGELOG.md)

---

*If you acidentally created a macro that locks you out of the game. You can fix it by holding the END key while logging into your world. This makes the module not run any macros.*
