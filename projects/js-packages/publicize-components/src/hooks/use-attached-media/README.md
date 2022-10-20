# useAttachedMedia() hook

React hooks to deal with attached media. It allows getting the attached media,
as well as updating it.

```es6
import { MediaUpload } from '@wordpress/components';
import useAttachedMedia from './hooks/use-attached-media';

function AttachedMediaSection() {
	const { attachedMedia, updateAttachedMedia } = useAttachedMedia();

	return (
		<MediaUpload
			onSelect={ updateMedia }
			allowedTypes={ ALLOWED_MEDIA_TYPES }
			render={ ( { open } ) => <Button isPrimary onClick={ open }>Pick Media</Button> }
		/>
	);
}
```
