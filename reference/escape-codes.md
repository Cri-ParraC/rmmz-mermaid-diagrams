# Text escape code reference

Reference for every text escape code in RPG Maker MZ v1.10.0, from
[`Window_Base.js`](../Corescript/js/rmmz_windows/Window_Base.js),
[`Window_Message.js`](../Corescript/js/rmmz_windows/Window_Message.js) and
[`Window_NameBox.js`](../Corescript/js/rmmz_windows/Window_NameBox.js). For the call flow, see
[window-text-escape-codes.mmd](../sequence-diagrams/window-text-escape-codes.mmd) and
[show-text-message.mmd](../sequence-diagrams/show-text-message.mmd).

## How text is processed

1. **Conversion** — `createTextState()` calls `convertEscapeCharacters(text)`, which works on the whole string before
   anything is drawn:
   1. every `\` becomes the control character `\x1b` (ESC);
   2. every `\x1b\x1b` (a typed `\\`) becomes a literal `\`;
   3. `\V[n]` is replaced **in a loop** until none is left, so `\V[\V[1]]` works;
   4. then `\N[n]`, `\P[n]` and `\G` are replaced (one pass each, in that order).

   All four use case-insensitive regexes (`/gi`).
2. **Drawing** — `processCharacter()` reads one character. Characters with a code below `0x20` flush the buffer and go
   to `processControlCharacter()`: `\n` → `processNewLine()`, `\x1b` → `obtainEscapeCode()` +
   `processEscapeCharacter(code, textState)`. Other characters are added to `textState.buffer` and drawn in one
   `drawText()` call by `flushTextState()`.
3. **Reading a code** — `obtainEscapeCode()` matches `/^[$.|^!><{}\\]|^[A-Z]+/i` right after the ESC and upper-cases it,
   so codes are case-insensitive and **letters are read greedily**: `\Cabc[2]` is read as code `CABC` and ignored.
   `obtainEscapeParam()` reads an optional `[digits]` and returns the number, or `""` if there is no bracket.
4. **Unknown codes** — the `switch` in `processEscapeCharacter()` has no `default` in `Window_Base`, so an unknown code
   is consumed and does nothing (its `[n]`, if any, is drawn as text because nobody reads it).

## Codes replaced before drawing (`Window_Base.convertEscapeCharacters`)

| Code | Meaning | Handled by | Notes |
|---|---|---|---|
| `\\` | A literal backslash | `convertEscapeCharacters()` | Converted before the other codes, so `\\V[1]` shows the text `\V[1]`. |
| `\V[n]` | Value of variable `n` | `convertEscapeCharacters()` → `$gameVariables.value(n)` | Repeated until no `\V[...]` is left (nesting allowed). Only digits are accepted inside the brackets. |
| `\N[n]` | Name of actor `n` | `actorName(n)` → `$gameActors.actor(n).name()` | `""` if `n` < 1 or the actor does not exist. |
| `\P[n]` | Name of party member `n` | `partyMemberName(n)` → `$gameParty.members()[n - 1].name()` | 1-based; `""` if `n` < 1 or out of range. |
| `\G` | Currency unit | `TextManager.currencyUnit` (`$dataSystem.currencyUnit`) | Passed as the replacement *string* of `String.replace`, so `$`-patterns in the unit name are interpreted by JavaScript. |

## Codes processed while drawing (`Window_Base.processEscapeCharacter`)

| Code | Meaning | Handled by | Notes |
|---|---|---|---|
| `\C[n]` | Text color `n` | `processColorChange(n)` → `changeTextColor(ColorManager.textColor(n))` | Color is read from the window skin at `(96 + (n % 8) × 12 + 6, 144 + floor(n / 8) × 12 + 6)`, i.e. the 32 swatches. Reset by `resetFontSettings()`. |
| `\I[n]` | Draw icon `n` | `processDrawIcon(n, textState)` → `drawIcon()` | Drawn at `x + (standardIconWidth − iconWidth) / 2 + 2`, `y + (standardIconHeight − iconHeight) / 2 + 2` (only when `textState.drawing`); then `x += standardIconWidth + 4` (36 px by default). |
| `\PX[n]` | Set x position | `textState.x = n` | Absolute x inside the contents, not relative to the line start. MZ-specific. |
| `\PY[n]` | Set y position | `textState.y = n` | Absolute y inside the contents. MZ-specific. |
| `\FS[n]` | Set font size to `n` | `this.contents.fontSize = n` | Also read ahead by `maxFontSizeInLine()` so the line height fits. MZ-specific. |
| `\{` | Font size + 12 | `makeFontBigger()` | Only if the current size is ≤ 96 (maximum 108). |
| `\}` | Font size − 12 | `makeFontSmaller()` | Only if the current size is ≥ 24 (minimum 12). |

Without a `[n]`, `\C`, `\I`, `\PX`, `\PY` and `\FS` receive `""` as the parameter.

**Line height.** `calcTextHeight()` = `maxFontSizeInLine(line) + (lineHeight() − $gameSystem.mainFontSize())`.
`maxFontSizeInLine()` scans the rest of the current line for `\{`, `\}` and `\FS[n]`, so a line containing a bigger
font is taller from its first character. `lineHeight()` is 36.

## Message-only codes (`Window_Message.processEscapeCharacter`)

These work only in the Show Text window. Other codes fall through to `Window_Base.processEscapeCharacter()`.

| Code | Meaning | Handled by | Notes |
|---|---|---|---|
| `\$` | Open the gold window | `this._goldWindow.open()` | The `Window_Gold` from `Scene_Message`. `updatePlacement()` puts it at the top if the message is not at the top, else at the bottom. It closes in `terminateMessage()`. |
| `\.` | Wait 1/4 second | `startWait(15)` | 15 frames. |
| `\\|` | Wait 1 second | `startWait(60)` | 60 frames. |
| `\!` | Wait for button | `startPause()` | `startWait(10)` and `this.pause = true`; continues on `isTriggered()` (OK, cancel or touch, repeated). |
| `\>` | Show the rest of the line at once | `this._lineShowFast = true` | Reset by `\<`, by every new line (`processNewLine()`) and by every new page (`clearFlags()`). |
| `\<` | Cancel `\>` | `this._lineShowFast = false` | |
| `\^` | Do not wait for input after the text | `this._pauseSkip = true` | At end of text, `onEndOfText()` calls `terminateMessage()` instead of `startPause()` (unless a choice / number / item input starts). Reset on each new page. |

### Timing details

- **Speed.** `updateMessage()` processes characters until `shouldBreakHere()`: without show-fast it breaks after every
  character, so text appears **one character (or one escape code) per frame**. UTF-16 low surrogates and, in RTL text,
  every non-space character are not break points (`canBreakHere()`).
- **Show fast.** `updateShowFast()` sets `_showFast` when `isTriggered()` is true; the rest of the page is then drawn
  in one frame, but it still stops at any wait (`isWaiting()`), so `\.`, `\|` and `\!` are **not** skipped by pressing OK.
- **Skipping waits.** `Window_Message.cancelWait()` sets `_waitCount` to 0 only if `$gameSystem.isMessageSkipEnabled()`
  (`$dataSystem.optMessageSkip`). It is called through `Scene_Message.cancelMessageWait()` from `Scene_Map.updateMainMultiply()` while `isFastForward()` (long
  press of OK or touch during an event).
- **Page end.** After every new line, `processNewLine()` calls `startPause()` when the next line no longer fits
  (`needsNewPage()`). The control character `\f` (added by `Game_Message.newPage()`, used by
  `BattleManager` and `Game_Actor.displayLevelUp()`; it has no `\` code) forces a page break through
  `processNewPage()`. The end of the text also waits 10 frames + input via `startPause()`.
- **Reset per page.** `newPage()` clears the contents, calls `resetFontSettings()` (font face, size, color) and
  `clearFlags()` (`_showFast`, `_lineShowFast`, `_pauseSkip`), then updates the speaker name and loads the face.

## Where codes work

All windows that draw with `drawTextEx()` / measure with `textSizeEx()` get the `Window_Base` codes; only
`Window_Message` gets the message-only codes.

| Window | Uses | Message-only codes |
|---|---|---|
| `Window_Message` (Show Text) | `createTextState()` + `processCharacter()` | yes |
| `Window_NameBox` (speaker name) | `drawTextEx()`, `textSizeEx()` | no |
| `Window_ChoiceList` (Show Choices) | `drawTextEx()`, `textSizeEx()` for the width | no |
| `Window_ScrollText` (Show Scrolling Text) | `drawTextEx()`, `textSizeEx()` for the height | no |
| `Window_Help` (descriptions) | `drawTextEx()` | no |
| `Window_BattleLog` (battle messages) | `drawTextEx()` per line | no |
| `Scene_Debug` help text | `helpWindow.drawTextEx()` | no |

Plain `drawText()` (item names, status values, menu commands) does **not** process escape codes.

## Speaker name (`Window_NameBox`)

| Step | Code | Behavior |
|---|---|---|
| Set | `Game_Interpreter.command101()` → `$gameMessage.setSpeakerName(params[4])` | Empty or missing name becomes `""`. |
| Update | `Window_Message.newPage()` → `updateSpeakerName()` → `_nameBoxWindow.setName($gameMessage.speakerName())` | `setName()` calls `refresh()` only when the name changed. |
| Start | `Window_Message.startMessage()` → `_nameBoxWindow.start()` | `updatePlacement()`, `updateBackground()` (same background type as the message), `createContents()`, `refresh()`. |
| Size | `windowWidth()` | `ceil(textSizeEx(name).width) + 2 × (padding + itemPadding())`, at most `Graphics.boxWidth`; **0 when the name is empty** (so no box is visible). Height is `fittingHeight(1)`. |
| Position | `updatePlacement()` | Above the message window if `messageWindow.y > 0`, otherwise below it. Left-aligned with the message window, or right-aligned when `$gameMessage.isRTL()`. |
| Draw | `refresh()` → `drawTextEx(this._name, ...)` | Escape codes such as `\C[n]`, `\N[n]`, `\V[n]` and `\I[n]` work in the name. |
| Open/close | `Window_Message.synchronizeNameBox()` | Every frame, the name box copies the message window's `openness`. |
