# useMediaDataUpdate

React custom hook to update the video data.
It returns a handler (a Promise) to hit the API endpoint.

```jsx
import { useMediaDataUpdate } from './use-video-data-update';

function VideoItem( { id } ) {

	const updateMediaHandler = useMediaDataUpdate( id );

	return (
		<TextControl
			label="title"
			value={ title }
			onChange={ newTitle => updateMediaHandler( { title: newTitle } ) }
		/>
	);
}
```
