# Player Bridge

A bridge to facilitate communication between the VideoPress player and the block editor.

## Overview

This script file is designed to be included and executed within a child document,
typically implemented via a core [Sandbox](https://github.com/WordPress/gutenberg/tree/trunk/packages/components/src/sandbox) component.

## Listening to Player Events

There is no need to use the bridge for this purpose.
You can subscribe to player events by accessing the `contentWindow`
of the sandbox iFrame element.
The player emits events to both its own window and the parent window.

## Triggering Events to the Player

To trigger events to the player:

- First obtain the `contentWindow` of the sandbox iFrame element.
- Then, use the `postMessage()` function to send the desired event.

```javascript
const iFrame = document.getElementById( 'my-sandbox-element' );
const iFrameWindow = iFrame?.contentWindow;

iFrameWindow?.postMessage( { event: 'videopress_action_pause' } );
