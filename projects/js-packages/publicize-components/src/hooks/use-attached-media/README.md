# useAttachedMedia() hook

React hooks to deal with attached media. It allows getting the attached media,
as well as updating it.

```es6
import { MediaUpload } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import useAttachedMedia from './hooks/use-attached-media';

function AttachedMediaSection() {
	const { attachedMedia, updateAttachedMedia } = useAttachedMedia();

	const mediaObject = useSelect( select =>
		select( 'core' ).getMedia( attachedMedia[ 0 ] || null, { context: 'view' } )
	);

	return (
		<MediaUpload
			onSelect={ updateAttachedMedia }
			render={ ( { open } ) => <Button isPrimary onClick={ open }>Pick Media</Button> }
		/>
	);
}
```
