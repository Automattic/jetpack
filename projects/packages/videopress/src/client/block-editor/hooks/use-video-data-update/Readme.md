# useMediaDataUpdate

React custom hook to update the video data.
It returns a handler (a Promise) to hit the API endpoint.

```jsx
import { useMediaDataUpdate } from './use-video-item-update';

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

# useSyncMedia

React custom hook to keep block attributes in sync with the video data.
The hook will keep the initial state of the attributes
and update the data when it detects changes after the post saves.

```jsx
import { useSyncMedia } from './use-video-item-update';

export default function VideoItemComponent( { attributes, setAttributes } ) {
	useSyncMedia( attributes, setAttributes );

	return (
		<TextControl
			label="title"
			value={ attributes.title }
			onChange={ newTitle => setAttributes( { title: newTitle } ) }
		/>
	);
}
```
