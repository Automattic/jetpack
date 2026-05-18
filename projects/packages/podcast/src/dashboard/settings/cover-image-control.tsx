// Apple Podcasts requires a square cover between 1400×1400 and 3000×3000.
// The picker (cover-image-picker.ts) enforces 1:1 via a Cropper subclass and
// rejects sources below the minimum dimension — this component is just the
// UI shell around it.

import { Button } from '@wordpress/components';
import { useCallback, useEffect, useId, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { disposeCoverImagePicker, openCoverImagePicker } from './cover-image-picker';

interface CoverImageControlProps {
	imageUrl: string;
	imageId: number;
	onSelect: ( imageId: number, imageUrl: string ) => void;
	onRemove: () => void;
	disabled?: boolean;
}

const CoverImageControl = ( {
	imageUrl,
	imageId,
	onSelect,
	onRemove,
	disabled,
}: CoverImageControlProps ) => {
	const [ error, setError ] = useState< string | null >( null );

	// Route callbacks through refs so the wp.media frame's listeners always
	// read the latest prop without forcing a frame rebuild.
	const onSelectRef = useRef( onSelect );
	onSelectRef.current = onSelect;

	const labelId = useId();
	const hasImage = !! imageUrl || imageId > 0;

	// Hoisted out of JSX so terser can't fold them into __(cond?'a':'b') —
	// the i18n-check validator rejects that shape.
	const changeLabel = __( 'Change cover', 'jetpack-podcast' );
	const setLabel = __( 'Set cover image', 'jetpack-podcast' );
	const noImageLabel = __( 'No image set', 'jetpack-podcast' );
	const triggerLabel = hasImage ? changeLabel : setLabel;

	useEffect( () => {
		return () => disposeCoverImagePicker();
	}, [] );

	const handleOpen = useCallback( () => {
		openCoverImagePicker( {
			onSelect: att => {
				setError( null );
				onSelectRef.current( att.id, att.url );
			},
			onError: message => setError( message ),
		} );
	}, [] );

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
				<Button variant="secondary" onClick={ handleOpen } disabled={ disabled }>
					{ triggerLabel }
				</Button>
				{ hasImage && (
					<Button variant="tertiary" isDestructive onClick={ onRemove } disabled={ disabled }>
						{ __( 'Remove', 'jetpack-podcast' ) }
					</Button>
				) }
			</div>
			{ error && (
				<p className="podcast__cover-error" role="alert">
					{ error }
				</p>
			) }
		</div>
	);
};

export default CoverImageControl;
