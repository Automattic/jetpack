// Apple Podcasts requires a square cover between 1400×1400 and 3000×3000.
// Surfaced as a soft warning, not a hard block — stock services often deliver
// close-but-not-exactly-square assets.

import { Button } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
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

const COVER_MIN = 1400;
const COVER_MAX = 3000;

const validate = ( att: MediaUploadAttachment ): string | null => {
	if ( ! att.width || ! att.height ) {
		return null;
	}
	if ( att.width !== att.height ) {
		return __(
			'Apple Podcasts requires a square image. Crop your image to a 1:1 ratio for the best results.',
			'jetpack-podcast'
		);
	}
	if ( att.width < COVER_MIN || att.width > COVER_MAX ) {
		return __(
			'For best results, use an image between 1400×1400 and 3000×3000 pixels.',
			'jetpack-podcast'
		);
	}
	return null;
};

const CoverImageControl = ( {
	imageUrl,
	imageId,
	onSelect,
	onRemove,
	disabled,
}: CoverImageControlProps ) => {
	const [ warning, setWarning ] = useState< string | null >( null );

	const hasImage = !! imageUrl || imageId > 0;

	// Hoisted out of JSX so terser can't fold them into __(cond?'a':'b') —
	// the i18n-check validator rejects that shape.
	const changeLabel = __( 'Change cover', 'jetpack-podcast' );
	const setLabel = __( 'Set cover image', 'jetpack-podcast' );
	const noImageLabel = __( 'No image set', 'jetpack-podcast' );
	const triggerLabel = hasImage ? changeLabel : setLabel;

	const handleSelect = useCallback(
		( att: MediaUploadAttachment ) => {
			setWarning( validate( att ) );
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
		<div className="podcast__cover-control">
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
			{ warning && <p className="podcast__cover-warning">{ warning }</p> }
		</div>
	);
};

export default CoverImageControl;
