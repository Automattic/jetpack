# useSyncMedia

React custom hook to keep block attributes in sync with the video data.
The hook will keep the initial state of the attributes
and update the data when it detects changes after the post saves.

```jsx
import { useSyncMedia } from './use-sync-media';

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
