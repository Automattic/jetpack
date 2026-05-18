// Cover-image picker. We accept any image the user picks: the feed renderer
// routes the URL through Photon with `resize=3000,3000`, which center-crops to
// a square server-side. The picker surfaces two flavors of guidance based on
// what we can read from the attachment metadata:
//   • warning — source is below Apple's 1400 px minimum (feed will be rejected).
//     Note: Photon center-crops to the source's *smaller* dimension, so a
//     3000×1000 source still produces a 1000×1000 cover.
//   • notice — source is non-square but large enough; will be center-cropped.

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

interface Message {
	level: 'warning' | 'notice';
	text: string;
}

const COVER_MIN_PX = 1400;

const CoverImageControl = ( {
	imageUrl,
	imageId,
	onSelect,
	onRemove,
	disabled,
}: CoverImageControlProps ) => {
	const [ message, setMessage ] = useState< Message | null >( null );
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
				setMessage( {
					level: 'warning',
					text: __(
						'Podcast directories require cover images at least 1400×1400 pixels and will reject smaller covers. Upload a larger image.',
						'jetpack-podcast'
					),
				} );
			} else if ( width && height && width !== height ) {
				setMessage( {
					level: 'notice',
					text: __(
						'This image will be center-cropped to a square in your feed. For full control, upload a 1:1 image.',
						'jetpack-podcast'
					),
				} );
			} else {
				setMessage( null );
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
			{ message && (
				<p
					className={
						message.level === 'warning' ? 'podcast__cover-warning' : 'podcast__cover-notice'
					}
					role={ message.level === 'warning' ? 'alert' : 'status' }
				>
					{ message.text }
				</p>
			) }
		</div>
	);
};

export default CoverImageControl;
