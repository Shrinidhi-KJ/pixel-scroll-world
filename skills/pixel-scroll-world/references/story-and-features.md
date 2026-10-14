# Story and features

## Contents
1. Turning a CV into levels
2. Dialogue windows and typed text
3. Atmosphere: parallax, weather, day and night
4. Rides
5. A flight between countries
6. Scroll-driven cut-scenes (graduation)
7. Projects as wild encounters
8. Skills as a shop of collectible discs
9. An arcade landing screen
10. Secrets and a badge case
11. Arrival cards and the HUD

## 1. Turning a CV into levels

A level is a place in the owner's life. A typical journey:

| Level | Stops | Places to draw |
|---|---|---|
| Home town | Title, About, Undergraduate, First job | Their street, a café or shop they love, their university, the office |
| A move | (travel) | A ride, a flight, a train |
| Further study | Postgraduate | The campus as it really is, the weather, a landmark |
| The work | Projects | A route through the wild, each project an encounter |
| Skills | Skills | A shop, a library, a workshop |
| Now | Contact | Their current city at night, a landmark, a signpost |

Ask the owner which places matter and for photos. Specific details (the local landmark, the
weather they complain about, a pet, a bakery near their home) make it theirs; generic towns make
it a template. Name the levels in the HUD ("Level 02 · Stirling").

## 2. Dialogue windows and typed text

Each section's `.window` is a game text box: an off-white panel, a thick dark border with an inner
blue frame, a hard drop shadow, a pixel heading. Keep content short in the game: a two-line About
with a photo, one card per job, one per project. Long text belongs in the plain CV.

Typing text: when a stop first becomes current, reveal its text character by character with a
blinking underscore at the writing point. Keep the full text in the DOM from the start and only
hide the not-yet-typed part (wrap each text node in a shown and a hidden span), so the window keeps
its size, nothing reflows and screen readers read it at once. Skip buttons and links (show them
whole) and finish within about three seconds however long the text is. Reduced motion shows
everything immediately.

## 3. Atmosphere: parallax, weather, day and night

- **Parallax:** distant hills, skylines and clouds drawn at half or a third of the camera speed.
- **Weather:** a small pool of particles (rain streaks, petals) reused every frame, only inside
  the stretch of route where it belongs. Rain can thin out as a level ends.
- **Day and night:** a sky that crossfades between a night palette and a day palette as the
  traveller crosses a range of route units; the moon sets behind a hill (clip it to the horizon)
  while the sun rises. Tie it to route position so it reverses.
- **Living lights:** a lamp that stutters, windows that go dark and light again, signs that blink.

## 4. Rides

A vehicle (auto-rickshaw, taxi, bus) pulls in from behind before a stop, carries the traveller
(only his head shows over the cabin) and drives on ahead after he steps out. Define each ride by
route positions: `{ from, board, alight, to }`. Before `board` the vehicle slides in; between
`board` and `alight` it sits under him with a one-pixel bounce; after `alight` it drives away.
Because it is all keyed to route position, it reverses.

## 5. A flight between countries

Give the stops either side of the move a long gap. Over that stretch, a height profile lifts him:
taxi along a runway, climb, cruise above a cloud sea (switch the sky to a gradient and draw cloud
layers at different parallax speeds), descend, land. Draw him in a small plane, cropped to his
head. A mountain range low on the horizon just after take-off says where he left. The HUD says
"Next quest" while he is in the air.

## 6. Scroll-driven cut-scenes (graduation)

A sequence like "walk into the university, cross the footbridge, come out in a cap and gown" is a
function from route position to the traveller's pose:

```js
function campus(rx) {
  if (rx < DOOR1) return { dy: rise(rx) };            // up the path to the door
  if (rx < B0)    return { dy: -51, hidden: true };    // inside the first building
  if (rx < B1)    return { dy: -51, bridge: true };    // on the bridge, legs behind its rail
  if (rx < DOOR2) return { dy: -36, hidden: true };    // inside the second
  return { dy: descend(rx) };                          // out of the door, down to the road
}
```

The first time he passes the exit, set the costume flag and celebrate (hops, sparkles, confetti,
a toast with the degree). After that, let him walk the plain road in both directions. Don't lock
the page or play anything on a timer; scrolling must always work.

## 7. Projects as wild encounters

Each project window becomes a battle screen built from its own markup: the project is the
opponent (a little robot sprite, its title, an HP bar), the owner's sprite faces it, and the moves
are the project's facts: "The question", "What I built", "How I checked it", "Result". Arriving at
the project flashes the screen ("A wild project appeared!") and plays the moves through once;
pressing a move types its text and knocks the HP down. Keep the original markup in the DOM for the
plain CV and assistive technology.

## 8. Skills as a shop of collectible discs

Each skill group is a case on a shop shelf; each skill a numbered disc in it. A player panel shows
the loaded disc (its number, name and case). Pointing at a disc loads it; left alone, it cycles
through the collection while the shop is on screen. The skill list itself stays as plain HTML.

## 9. An arcade landing screen

The site opens in a room with three arcade cabinets. The middle one is the game: its screen shows
the title scene, a Start button and "Scroll to explore". Start, a key or the first scroll zooms
into the screen (a CSS transform on the whole room, then fade) and the page becomes the game.
Scrolling up past the very top backs out to the room. The side cabinets can play tiny attract-mode
games on their screens; one can even be playable with the mouse.

Design notes: the room is one canvas drawn once (re-drawn on resize); its decorations are a
separate drawing function, so themes are easy to try (neon arcade, cosy bedroom, trophy hall).
Skip the landing for reduced motion and for links to a section.

## 10. Secrets and a badge case

Small tappable things in the world, each with a one-line hint in a badge case at Contact:
pet an animal (hearts), befriend a swan so her cygnets follow you, take the traffic cone off a
statue and wear it, get a "Hire me" item from a shopkeeper (a toast with the email address), do a
loop in the plane. A toast says "Secret found: name 3/5". Collect tap targets while drawing each
frame; test taps against that list. Reset everything on reload.

When two costume items can stack (a mortarboard and a cone), decide the order and draw both.

## 11. Arrival cards and the HUD

The HUD (the fixed nav bar) shows the current level's name and links to the sections. When a new
place begins, an arrival card can name it with one line of personality ("Stirling, Scotland:
where the rain falls sideways"). Write those lines with the owner; they set the tone of the site.
