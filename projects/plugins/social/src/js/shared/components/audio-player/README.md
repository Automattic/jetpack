# `AudioPlayer` Component

## Overview

This component forms the audio element of the podcast player. It has been abstracted and moved to the shared components, so that it can be used by other blocks.

The principle behind the component is for it to act like a controlled `form` input, with its state being managed elsewhere.

## Usage

In a similar way to a controlled input the component takes some props to determine its current state, along with some callbacks so that other parts of the system can be informed of the need to change the state. This in turn should cause a change to the props passed into the component. 

For example, someone clicks on the play button, the `onPlay` handler is called, which updates some state and passes `STATE_PLAYING` back to the component in the `playStatus` prop. In reality there are some issues with this approach outlined below.

### Props

#### `playStatus`

Determines whether playback is currently in progress, valid values are in `constants.js` and include `STATE_PLAYING` and `STATE_PAUSED`.

#### `trackSource`

The URL of the audio file to play. In the case of the podcast player, this is almost always an MP3 or M4A file, but it can be any valid file for the browser's native `audio` element.

#### `currentTime`

Used in conjunction with `onTimeChange` this tracks the current position in the audio file, and can be set to a value in order to jump back and forth.

#### `loadWhenReady`

Loads the audio file when it's ready. `False` as default.

#### `preload`

This props will be propagated to the <audio> element.

> This enumerated attribute is intended to provide a hint to the browser about what the author thinks will lead to the best user experience. 

https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-preload

`metadata` as default.


#### `onTimeChange`

While the file is playing, this callback will be triggered every second to update the controlling component that the time position has changed. This value is then expected to be passed back in using the `currentTime` prop.

If the value passed in is more than a second different to the current position in the audio file, then it's assumed we would like to seek to that time.

#### `onPlay` and `onPause`

These callbacks are triggered as their respective play statuses are changed. It is expected that the `playStatus` prop will be updated as a result.

#### `onError`

Called when an error occurs with playback on the file.

#### `onSkipForward` and `onJumpBack`

The presence of these props will cause an associated button control to be rendered in the player. If they are clicked then the callback will be called and the controlling component can move the position in the file using the `currentTime` prop.

## Potential issues

Currently the component is a wrapper around a `MediaElement.js` component which does its own event handling. It's possible therefore, that the state of the player can get out of sync with the state of the controlling component. We have seen an example of this caused by rapid clicking on the track progress bar, which was solved by debouncing the events.

In testing we've not seen any other issues of this nature, but if the audio player gets stuck in some kind of loop, jumping back and forth, or flicking between a play and pause state, then this is likely the cause.

## Futere enhancements

In future it would be good to remove the `MediaElement.js` dependency. The native `audio` element has good support across all major browsers, and the `MediaElement.js` Flash fallback is unlikely to run in any modern browser. 

Removing this dependency will allow us to have better control of the underlying `audio` component, and we can make the controls of the component React based and composable to facilitate the creation of custom interfaces based on the context the component is used in.
