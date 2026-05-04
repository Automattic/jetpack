/**
 * Cover image picker for the podcast Settings tab.
 *
 * Wraps the wp-admin media frame (`wp.media`) so editors can pick an existing
 * attachment or upload a new one. Apple Podcasts requires a square cover
 * between 1400×1400 and 3000×3000 — we surface that as a soft warning rather
 * than a hard block, since stock photo services often deliver close-but-not-
 * exactly-square assets.
 */

import { Button, Spinner } from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

interface CoverImageControlProps {
	imageUrl: string;
	imageId: number;
	onSelect: ( imageId: number, imageUrl: string ) => void;
	onRemove: () => void;
	disabled?: boolean;
}

interface MediaAttachment {
	id: number;
	url: string;
	width?: number;
	height?: number;
}

interface MediaFrame {
	on: ( event: string, handler: ( ...args: unknown[] ) => void ) => void;
	open: () => void;
	state: () => { get( key: 'selection' ): { first(): { toJSON(): MediaAttachment } } };
}

type WpMedia = ( opts: Record< string, unknown > ) => MediaFrame;

const getWpMedia = (): WpMedia | undefined => {
	const wp = ( window as unknown as { wp?: { media?: WpMedia } } ).wp;
	return wp?.media;
};

const COVER_MIN = 1400;
const COVER_MAX = 3000;

const validate = ( att: MediaAttachment ): string | null => {
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
	const [ frame, setFrame ] = useState< MediaFrame | null >( null );
	const [ warning, setWarning ] = useState< string | null >( null );

	useEffect( () => {
		const wpMedia = getWpMedia();
		if ( ! wpMedia ) {
			return;
		}
		const mediaFrame = wpMedia( {
			title: __( 'Select a podcast cover image', 'jetpack-podcast' ),
			button: { text: __( 'Use this image', 'jetpack-podcast' ) },
			library: { type: 'image' },
			multiple: false,
		} );

		mediaFrame.on( 'select', () => {
			const selection = mediaFrame.state().get( 'selection' ).first().toJSON();
			setWarning( validate( selection ) );
			onSelect( selection.id, selection.url );
		} );

		setFrame( mediaFrame );
	}, [ onSelect ] );

	const open = useCallback( () => {
		frame?.open();
	}, [ frame ] );

	const hasImage = !! imageUrl || imageId > 0;

	return (
		<div className="podcast__cover-control">
			<div className="podcast__cover-preview">
				{ imageUrl ? (
					<img src={ imageUrl } alt={ __( 'Podcast cover', 'jetpack-podcast' ) } />
				) : (
					<span className="podcast__cover-placeholder">
						{ frame ? __( 'No image set', 'jetpack-podcast' ) : <Spinner /> }
					</span>
				) }
			</div>
			<div className="podcast__cover-actions">
				<Button variant="secondary" onClick={ open } disabled={ disabled || ! frame }>
					{ hasImage
						? __( 'Change cover', 'jetpack-podcast' )
						: __( 'Set cover image', 'jetpack-podcast' ) }
				</Button>
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
