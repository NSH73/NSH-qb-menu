# qb-menu
Premium Menu System for the QBCore Framework


## Features

- 🎨 **Dark Shiny Cards** - Premium gradient glass effect with professional styling
- ⌨️ **Keyboard Navigation** - Use arrow keys to navigate, Enter/Space to select
- 🖱️ **Mouse Wheel Scroll** - Smooth horizontal scrolling for large menus
- 🔊 **Sound Effects** - Subtle audio feedback (hover, click, locked)
- 📱 **Responsive Design** - Optimized for 1080p, 1440p, and 4K displays
- ✨ **Professional Animations** - Smooth transitions and glow effects
- 🎯 **Auto-centering** - Selected items automatically scroll into view
- 🚀 **Performance Optimized** - Minimal FPS impact with efficient rendering

## Menu Item

| Param | Description | Type | Default value |
| ----- | ----------- | ---- | ------- |
| header| The item title | string | No default |
| txt? | The item description | string | "" |
| isMenuHeader? | Whether the item is the header of the menu | boolean | false |
| disabled? | Whether the item is clickable | boolean | false |
| params | The options of the menu | table | No default |
| params.event | Event name, command or function | string \| function | "" |
| params.isAction? | Whether the event is a function | boolean | false |
| params.isServer? | Whether the event is the name of a server event | boolean | false |
| params.isCommand? | Whether the event is the name of command | boolean | false |
| params.isQBCommand? | Whether the event is the name of a qbcore command | boolean | false |
| params.args? | Arguments for the events/commans/function | table | nil |

## Controls

| Control | Action |
| ------- | ------ |
| ← → Arrow Keys | Navigate between menu items |
| Enter / Space | Select current item |
| Mouse Wheel | Scroll through large menus |
| ESC | Close menu |
| Mouse Click | Select item directly |

## Optional Sound Files

For custom sounds, place MP3 files in the `sounds/` folder:
- `sounds/hover.mp3` - Plays when hovering over items
- `sounds/click.mp3` - Plays when selecting items  
- `sounds/locked.mp3` - Plays when clicking disabled items

If custom sounds are not found, the menu uses built-in synthesized tones.


# Examples

```LUA
RegisterCommand("qbmenutest", function(source, args, raw)
    exports["qb-menu"]:openMenu({
        {
            header = "Main Title",
            isMenuHeader = true, -- Set to true to make a nonclickable title
        },
        {
            header = "Sub Menu Button",
            txt = "This goes to a sub menu",
            params = {
                event = "qb-menu:client:testMenu2",
                args = {
                    number = 1,
                }
            }
        },
        {
            header = "Sub Menu Button",
            txt = "This goes to a sub menu",
            disabled = true,
            -- hidden = true, -- doesnt create this at all if set to true
            params = {
                event = "qb-menu:client:testMenu2",
                args = {
                    number = 1,
                }
            }
        },
    })
end)
```
```LUA
RegisterNetEvent('qb-menu:client:testMenu2', function(data)
    local number = data.number
    exports["qb-menu"]:openMenu({
        {
            header = "< Go Back",
        },
        {
            header = "Number: "..number,
            txt = "Other",
            params = {
                event = "qb-menu:client:testButton",
                args = {
                    message = "This was called by clicking this button"
                }
            }
        },
    })
end)
```
```LUA
RegisterNetEvent('qb-menu:client:testButton', function(data)
    TriggerEvent('QBCore:Notify', data.message)
end)
```

# License

    QBCore Framework
    Copyright (C) 2021 Joshua Eger

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
