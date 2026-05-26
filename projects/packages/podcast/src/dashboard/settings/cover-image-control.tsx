// Cover-image picker. We accept any image the user picks: the feed renderer
// routes the URL through Photon with `resize=3000,3000`, which center-crops to
// a square server-side, and the preview here is CSS-cropped to match. The
// only hard-failure we surface is a source below the 1400 px minimum (Photon
// center-crops to the source's *smaller* dimension, so a 3000×1000 source
// still produces a 1000×1000 cover — too small for podcast directories).

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

const COVER_MIN_PX = 1400;

const CoverImageControl = ( {
	imageUrl,
	imageId,
	onSelect,
	onRemove,
	disabled,
}: CoverImageControlProps ) => {
	const [ warning, setWarning ] = useState< string | null >( null );
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
			const { width, height } = att;
			if ( width && height && Math.min( width, height ) < COVER_MIN_PX ) {
				setWarning(
					__(
						'Podcast directories require cover images at least 1400×1400 pixels and will reject smaller covers. Upload a larger image.',
						'jetpack-podcast'
					)
				);
			} else {
				setWarning( null );
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
			{ warning && (
				<p className="podcast__cover-warning" role="alert">
					{ warning }
				</p>
			) }
		</div>
	);
};

export default CoverImageControl;
