// Cover-image picker. We accept any image the user picks: the feed renderer
// routes the URL through Photon with `resize=3000,3000`, which center-crops to
// a square server-side. A soft notice tells the user we'll auto-crop when the
// source isn't already 1:1, so the in-feed result isn't a surprise.

import { Button } from '@wordpress/components';
import { useCallback, useId, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { MediaUpload } from '@wordpress/media-utils';

interface CoverImageControlProps {
	imageUrl: string;
	imageId: number;
	onSelect: ( imageId: number, imageUrl: string ) => void;
	onRemove: () => void;
	disabled?: boolean;
}

interface MediaUploadAttachment {
	id: number;
	url: string;
	width?: number;
	height?: number;
}

const CoverImageControl = ( {
	imageUrl,
	imageId,
	onSelect,
	onRemove,
	disabled,
}: CoverImageControlProps ) => {
	const [ notice, setNotice ] = useState< string | null >( null );
	const labelId = useId();

	const hasImage = !! imageUrl || imageId > 0;

	// Hoisted out of JSX so terser can't fold them into __(cond?'a':'b') —
	// the i18n-check validator rejects that shape.
	const changeLabel = __( 'Change cover', 'jetpack-podcast' );
	const setLabel = __( 'Set cover image', 'jetpack-podcast' );
	const noImageLabel = __( 'No image set', 'jetpack-podcast' );
	const triggerLabel = hasImage ? changeLabel : setLabel;

	const handleSelect = useCallback(
		( att: MediaUploadAttachment ) => {
			if ( att.width && att.height && att.width !== att.height ) {
				setNotice(
					__(
						'This image will be center-cropped to a square in your feed. For full control, upload a 1:1 image.',
						'jetpack-podcast'
					)
				);
			} else {
				setNotice( null );
			}
			onSelect( att.id, att.url );
		},
		[ onSelect ]
	);

	const renderTrigger = useCallback(
		( { open }: { open: () => void } ) => (
			<Button variant="secondary" onClick={ open } disabled={ disabled }>
				{ triggerLabel }
			</Button>
		),
		[ disabled, triggerLabel ]
	);

	return (
		<div className="podcast__cover-control" role="group" aria-labelledby={ labelId }>
			<span id={ labelId } className="podcast__cover-label">
				{ __( 'Cover image', 'jetpack-podcast' ) }
			</span>
			<div className="podcast__cover-preview">
				{ imageUrl ? (
					<img src={ imageUrl } alt={ __( 'Podcast cover', 'jetpack-podcast' ) } />
				) : (
					<span className="podcast__cover-placeholder">{ noImageLabel }</span>
				) }
			</div>
			<div className="podcast__cover-actions">
				<MediaUpload
					title={ __( 'Select a podcast cover image', 'jetpack-podcast' ) }
					allowedTypes={ [ 'image' ] }
					value={ imageId || undefined }
					onSelect={ handleSelect }
					render={ renderTrigger }
				/>
				{ hasImage && (
					<Button variant="tertiary" isDestructive onClick={ onRemove } disabled={ disabled }>
						{ __( 'Remove', 'jetpack-podcast' ) }
					</Button>
				) }
			</div>
			{ notice && <p className="podcast__cover-notice">{ notice }</p> }
		</div>
	);
};

export default CoverImageControl;
