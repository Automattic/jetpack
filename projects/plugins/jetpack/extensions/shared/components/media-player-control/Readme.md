Media Player control
====================

Implement a media player control connected to the [Media Source Store](./extensions/stores/media-source/).

## Props

### skipForwardTime
Time value to skip forward when clicking on the forwarding button. Or, `False` to do not render the button. `five` seconds as default.

* Type: `?(Number|boolean)`
* Required: No
* Default: `5`


### jumpBackTime
Time value to jump back when clicking on the forwarding button. Or, `False` to do not render the button. `five` seconds as default.

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

## Utils

It exposes some util helper functions to deal with underlying tasks when working with time-value processing.

### convertSecondsToTimeCode( {int} seconds )

Converts the given time, in seconds, to the time code format: `HH:MM:SS`.

### convertTimeCodeToSeconds( {string} timeCode )
Converts the given time code, in string format, to the time in seconds.

