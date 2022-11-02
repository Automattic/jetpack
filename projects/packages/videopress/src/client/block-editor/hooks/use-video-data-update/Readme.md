# useMediaItemUpdate

React custom hook to update the video data.
It returns a handler (a Promise) to hit the API endpoint.

```jsx
import { useMediaItemUpdate } from './use-video-item-update';

function VideoItem( { id } ) {

	const updateMediaHandler = useMediaItemUpdate( id );

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

export default function VideoItemComponent( { setAttributes } ) {
	useSyncMedia( attributes, 'title' );

	return (
		<TextControl
			label="title"
			value={ attributes.title }
			onChange={ newTitle => setAttributes( { title: newTitle } ) }
		/>
	);
}
```

## Forcing initial state

In case you need to force the initial state, the hook returns a handler:

```jsx
import { useSyncMedia } from './use-video-item-update';

export default function VideoItemComponent( { attributes, setAttributes } ) {
	const [ forceInitialState ] = useSyncMedia( attributes, [ 'title' ] );

	useEffect( () => {
		if ( dataChanged ) {
			return;
		}

		forceInitialState( dataChanged );
	}, [ dataChanged, forceInitialState ]

	return (
		<TextControl
			label="title"
			value={ attributes.title }
			onChange={ newTitle => setAttributes( { title: newTitle } ) }
		/>
	);
}
```