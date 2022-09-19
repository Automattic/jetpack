# useMediaItemUpdate

React custom hook to update the video metadata

```jsx
import { useMediaItemUpdate } from './use-video-item-update';

function VideoItem( { id }) {

	const updateMedia = useMediaItemUpdate( id );

	return (
		<TextControl
			label="title"
			value={ title }
			onChange={ newTitle => updateMedia( { title: newTitle } ) }
		/>
	);
}
```

# useSyncMedia

React custom hook to keep block attributes in-sync with the video item metadata.
The hook will keep the initial state of the attributes to keep in-sync, 
and will update them at the same time the post saves.

```jsx
import { useSyncMedia } from './use-video-item-update';

export default function VideoItemComponent( { attributes, setAttributes } ) {
	useSyncMedia( attributes );

	return (
		<TextControl
			label="title"
			value={ attributes.title }
			onChange={ newTitle => setAttributes( { title: newTitle } ) }
		/>
	);
}
```

## Update data to sync

In case you need to update the data to sync, the hook returns a handler for it:

```jsx
import { useSyncMedia } from './use-video-item-update';

export default function VideoItemComponent( { attributes, setAttributes } ) {
	const [ updateDataToSync ] = useSyncMedia( attributes );

	useEffect( () => {
		if ( dataChanged ) {
			return;
		}

		updateDataToSync( dataChanged );
	}, [ dataChanged, updateDataToSync ]

	return (
		<TextControl
			label="title"
			value={ attributes.title }
			onChange={ newTitle => setAttributes( { title: newTitle } ) }
		/>
	);
}
```