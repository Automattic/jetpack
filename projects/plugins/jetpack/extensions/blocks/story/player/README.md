# Story Player

This is a quick introduction to the story player codebase.

#### [`StoryPlayer`](./index.js)
This is the top-level React component.
It is used to display a story on a page from a React context.

`StoryPlayer` accepts a list of `slides` and an optional `settings` object to configure the player
(see `defaultPlayerSettings` in [`store/constants.js`](./store/constants.js) for a list of available settings).

`StoryPlayer` is used in both [`view.js`](../view.js) and [`edit.js`](../edit.js), which means that the
same component renders a story on the frontend and the editor.

It wraps 2 components, one inside of the other: `ExpandableSandbox` and `PlayerUI`.

#### [`ExpandableSandbox`](./expandable-sandbox.js)
This component is able to sandbox the player in a Shadow DOM automatically
and also supports fullscreen.

Shadow DOM is used to sandbox styles essentially, so that components, like buttons for controls, can always look right in any context.

Fullscreen is supported using 2 methods:
- The HTML5 fullscreen API.
- An HTML modal (sandboxed as well).

In the case of the fullscreen API, not much else needs to be done, you just give the API an element
and the browser will try to display it fullscreen. We only enable this on mobile though as it
can be quite a disruptive user experience on desktop.
The modal approach is a simple div, appended at the end of body, with a `display: fixed` and a high z-index.
It has a `dialog` role so screen readers know when a modal just opened and can act accordingly.
Moreover, we use some hooks in the component to prevent keyboard tabbing outside the modal and handle focus on open and close (it’s mostly taken from modals in gutenberg core, some hooks needed to be copied (in `./lib`) as jetpack doesn’t depend on the latest gutenberg)

#### [`PlayerUI`](./player-ui.js)
This is the UI implementation of the story player: it handles all the UI logic related to story playback: showing slides, title, progress bars, controls, etc.
Most of the UI components it uses are declared in [`./components`](./components), except for [`Slide`](./slide.js) and
[`ProgressBar`](./progress-bar.js) which are "store-connected" UI components.

#### [`store`](./store)
A global store is used to maintain a state for each story. This serves multiple purposes:
- A story can be unmounted and remounted anywhere on the page
- It can also be duplicated, allowing features such as fullscreen in a modal
- The same story can share the same state with different instances if they use the same id (that's the case by default).
- We can apply side effects on state change, outside of the UI code, this helps keep the UI component simpler
