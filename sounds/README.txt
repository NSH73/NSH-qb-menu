QB-Menu Sound Effects
=====================

The menu now includes built-in procedural sound effects using Web Audio API.

CUSTOM SOUNDS (Optional):
-------------------------
You can replace the default sounds by adding your own audio files here:

- hover.mp3   - Plays when hovering over buttons (subtle whoosh)
- click.mp3   - Plays when clicking active buttons (confirmation beep)
- locked.mp3  - Plays when clicking disabled/locked buttons (error sound)

Recommended Sound Characteristics:
- Format: MP3 or OGG
- Duration: 50-150ms (short UI sounds)
- Volume: Normalized, not too loud
- Style: Modern UI, game-like, subtle

Sound Sources:
- Freesound.org
- Zapsplat.com (free UI sounds)
- Game UI sound packs
- Create your own with Audacity

Default Behavior:
-----------------
Without custom files, the menu uses procedurally generated tones:
✓ Hover: 800Hz sine wave (subtle)
✓ Click: 1200Hz sine wave (confirmation)
✓ Locked: 600Hz→200Hz descending square wave (error)

To disable sounds entirely, set SoundManager.enabled = false in script.js
