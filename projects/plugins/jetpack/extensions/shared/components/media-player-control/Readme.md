Media Player control
====================

Implement a media player control.

```es6
function MyMediaComponent() {
	const [ playerState, setPlayerState ] = useState( STATE_PAUSED );

	<MediaPlayerControl
		state={ playerState }
		onToggle={ setPlayerState }
	/>
}
```

## Props

### time [s]
Player current time, in seconds.

* Type: `Number`
* Required: No

### state
Player current state. It could take `is-playing` or `is-paused`.
We encourage using constants defined in the [media source store](./extensions/stores/media-source/constants.js), instead of custom strings.

* Type: `String`
* Required: No

### skipForwardTime
Time value to skip forward when clicking on the forwarding button. `five` seconds as default.

* Type: `Number`
* Required: No
* Default: `5`


### jumpBackTime
Time value to jump back when clicking on the forwarding button. `five` seconds as default.

* Type: `Number`
* Required: No
* Default: `5`

### playIcon
Icon to show in the `play` button. `controls-play` as default.

* Type: `?(string|WPElement)`
* Required: No
* Default: `controls-play`

### pauseIcon
Icon to show in the `pause` button. `controls-pause` as default.

* Type: `?(string|WPElement)`
* Required: No
* Default: `controls-pause`

### isDisabled
Disables/Enables all player buttons.

* Type: `boolean`
* Required: No
* Default: `False`

### onTimeChange
A callback invoked when the time value changes. It passes time (number) as a callback parameter.

* Type: `Function`
* Required: No

### onToggle
A callback invoked when the player state changes. It passes state (string) as a callback parameter.

* Type: `Function`
* Required: No

## Utils

It exposes some util helper functions to deal with underlying tasks when working with time-value processing.

### convertSecondsToTimeCode( {int} seconds )

Converts the given time, in seconds, to the time code format: `HH:MM:SS`.

### convertTimeCodeToSeconds( {string} timeCode )
Converts the given time code, in string format, to the time in seconds.

