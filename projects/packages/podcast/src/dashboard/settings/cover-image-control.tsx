// Apple Podcasts requires a square cover between 1400×1400 and 3000×3000.
// We use the same wp.media frame pattern WP core uses for the Site Icon: a
// Library state followed by a Cropper state that enforces a 1:1 aspect ratio
// and posts to core's built-in `crop-image` AJAX endpoint to produce a new
// square attachment.

import { Button } from '@wordpress/components';
import { useCallback, useEffect, useId, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

interface CoverImageControlProps {
	imageUrl: string;
	imageId: number;
	onSelect: ( imageId: number, imageUrl: string ) => void;
	onRemove: () => void;
	disabled?: boolean;
}

// Minimal wp.media ambient surface — the official @wordpress packages don't
// ship types for the legacy Backbone media frame. We only declare what we use.
interface WpAttachmentModel {
	get( key: string ): unknown;
	toJSON(): { id: number; url: string; width?: number; height?: number };
}
interface WpSelection {
	first(): WpAttachmentModel | undefined;
}
interface WpFrame {
	on( event: string, cb: ( ...args: unknown[] ) => void ): WpFrame;
	off( event: string, cb?: ( ...args: unknown[] ) => void ): WpFrame;
	open(): void;
	close(): void;
	setState( name: string ): void;
	state(): { get( key: 'selection' ): WpSelection };
}
interface WpMedia {
	( options: Record< string, unknown > ): WpFrame;
	controller: {
		Library: new ( opts: Record< string, unknown > ) => unknown;
		Cropper: new ( opts: Record< string, unknown > ) => unknown;
	};
	query( opts: Record< string, unknown > ): unknown;
}
declare global {
	interface Window {
		wp?: { media?: WpMedia };
	}
}

// Apple's spec: 1400–3000 px square. We crop to 1400 — safely in-spec and
// matches the smallest legitimate source we'd accept.
const TARGET_PX = 1400;

const CoverImageControl = ( {
	imageUrl,
	imageId,
	onSelect,
	onRemove,
	disabled,
}: CoverImageControlProps ) => {
	const [ error, setError ] = useState< string | null >( null );
	const frameRef = useRef< WpFrame | null >( null );
	// The wp.media frame is cached across opens so listeners stay wired. Route
	// onSelect through a ref so the cached listeners always read the latest
	// prop without forcing a frame rebuild.
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
		return () => {
			frameRef.current?.off( 'select' );
			frameRef.current?.off( 'cropped' );
			frameRef.current?.off( 'skippedcrop' );
			frameRef.current = null;
		};
	}, [] );

	const commit = useCallback( ( att: { id: number; url: string } ) => {
		setError( null );
		onSelectRef.current( att.id, att.url );
	}, [] );

	const openPicker = useCallback( () => {
		const media = window.wp?.media;
		if ( ! media ) {
			setError(
				__( 'The media picker failed to load. Refresh the page and try again.', 'jetpack-podcast' )
			);
			return;
		}

		if ( frameRef.current ) {
			frameRef.current.open();
			return;
		}

		const frame = media( {
			button: {
				text: __( 'Crop and use', 'jetpack-podcast' ),
				close: false,
			},
			states: [
				new media.controller.Library( {
					title: __( 'Select a podcast cover image', 'jetpack-podcast' ),
					library: media.query( { type: 'image' } ),
					multiple: false,
					date: false,
					priority: 20,
					suggestedWidth: TARGET_PX,
					suggestedHeight: TARGET_PX,
				} ),
				new media.controller.Cropper( {
					// Default imgSelectOptions reads width/height from `control.params`
					// and uses them as the aspect ratio + minimum crop box. Passing equal
					// width/height enforces a square selection.
					control: {
						params: {
							width: TARGET_PX,
							height: TARGET_PX,
							flex_width: false,
							flex_height: false,
						},
					},
				} ),
			],
		} );

		// 'select' fires after the user picks an image in the Library state.
		// Skip the crop step entirely if the source is already square — otherwise
		// advance to the Cropper state for a forced 1:1 crop.
		frame.on( 'select', () => {
			const attachment = frame.state().get( 'selection' ).first()?.toJSON();
			if ( ! attachment ) {
				return;
			}
			const { width, height } = attachment;
			if ( width && height && width === height ) {
				frame.close();
				commit( attachment );
				return;
			}
			frame.setState( 'cropper' );
		} );

		// Fired by the Cropper state with the new attachment that core's
		// `wp_ajax_crop_image` handler created. The response payload exposes
		// `attachment_id` (not `id`).
		frame.on( 'cropped', ( ...args: unknown[] ) => {
			const cropped = args[ 0 ] as
				| { attachment_id?: number; id?: number; url?: string }
				| undefined;
			const id = cropped?.attachment_id ?? cropped?.id;
			if ( id && cropped?.url ) {
				commit( { id, url: cropped.url } );
			}
		} );

		// The Cropper exposes a "Skip Cropping" affordance. We can't honor it —
		// non-square covers fail RSS validation — so surface a clear error and
		// leave the frame open for them to try again.
		frame.on( 'skippedcrop', () => {
			setError(
				__( 'Cover images must be square (1:1). Adjust the crop and try again.', 'jetpack-podcast' )
			);
		} );

		frameRef.current = frame;
		frame.open();
	}, [ commit ] );

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
				<Button variant="secondary" onClick={ openPicker } disabled={ disabled }>
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
