# Player Bridge

Bridge to communicate player with the block editor.

## How

The file script is intended to be provided and run to a children document,
usually implemented via a core Sandbox component.


## Listen to player events

You don't need to use the bridge for this.
It's possible to get subscribed just by picking the `contentWindow` of the sandbox iFrame element,
since the player emits evens to its window and parent window.

## Triggering events to the player

You need to get the `contentWindow` of the sandbox iFrame element, and trigger the events just by calling the postMessage() function:

```es6
const iFrame = getElementById( 'my-sandbox-element' );
const iFrameWindow = iFrame?.contentWindow;

iFrameWindow?.postMessage( { event: 'videopress_action_pause' } );
```