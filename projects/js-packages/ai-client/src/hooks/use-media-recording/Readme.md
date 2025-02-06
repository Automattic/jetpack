# `useMediaRecording` Custom React Hook

## Description

`useMediaRecording` is a custom React hook for handling media recording functionalities in a React application. It provides an easy way to start, pause, resume, and stop media recording, as well as to track the current recording state.

Based on [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) API

## API

The hook returns an object with the following properties and methods:

- `state: 'inactive' | 'recording' | 'paused'` - Current recording state
- `blob`: `blob` - The recorded blob
- `url`: `string` - The recorded blob url
- `start: ( timeslice ) => void` - Start the media recording
- `pause: () => void` - Pause the current media recording
- `resume: () => void` - Resume a paused recording
- `stop: () => void` - Stop the current recording

## Example

Here's an example React component that utilizes the `useMediaRecording` hook.

```jsx
import useMediaRecording from './useMediaRecording/index.js';

const MediaRecorderComponent = () => {
	const { start, pause, resume, stop, state } = useMediaRecording();

	return (
		<div>
			<h1>Media Recorder</h1>
			<p>Current State: { state }</p>
			<button onClick={ start } disabled={ state !== 'inactive' }>
				Start
			</button>
			<button onClick={ pause } disabled={ state !== 'recording' }>
				Pause
			</button>
			<button onClick={ resume } disabled={ state !== 'paused' }>
				Resume
			</button>
			<button onClick={ stop } disabled={ state === 'inactive' }>
				Stop
			</button>
		</div>
	);
};
```
