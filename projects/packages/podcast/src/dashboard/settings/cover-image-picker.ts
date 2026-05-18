/**
 * Cover image picker — opens a wp.media frame that forces a 1:1 crop, mirroring
 * WP core's Site Icon UX but routed through a podcast-specific AJAX context so
 * the resulting attachment isn't tagged `_wp_attachment_context = site-icon`.
 *
 * The base `wp.media.controller.Cropper` is effectively abstract: its built-in
 * `doCrop` posts to `custom-header-crop` and it relies on a subclass to supply
 * `imgSelectOptions`. We subclass it via Backbone's `extend` to override both.
 */

import { __ } from '@wordpress/i18n';

// Apple Podcasts spec: 1400–3000 px square. We crop to 1400 — safely in-spec
// and matches the smallest legitimate source we'll accept.
export const COVER_TARGET_PX = 1400;

// Restrict to formats wp_crop_image() can actually process server-side.
// SVG returns false; WebP works on modern hosts (GD ≥ 2.1.0, ImageMagick ≥ 7.0.8-27).
const ALLOWED_MIME_TYPES = [ 'image/jpeg', 'image/png', 'image/gif', 'image/webp' ];

// --- wp.media ambient surface --------------------------------------------------
// The official @wordpress packages don't ship Backbone-style types. We only
// declare the slice we actually call.

interface BackboneAttrs {
	get( key: string ): unknown;
	set( attrs: Record< string, unknown > ): void;
	toJSON(): Record< string, unknown >;
}
interface AttachmentModel extends BackboneAttrs {
	id: number;
}
interface SelectionModel {
	first(): AttachmentModel | undefined;
}
interface FrameStateModel {
	get( key: 'selection' ): SelectionModel;
}
interface MediaFrame {
	on( event: string, cb: ( ...args: unknown[] ) => void ): MediaFrame;
	off( event: string, cb?: ( ...args: unknown[] ) => void ): MediaFrame;
	open(): void;
	close(): void;
	setState( name: string ): void;
	state(): FrameStateModel;
}
interface BackboneExtendable< Instance > {
	new ( opts?: Record< string, unknown > ): Instance;
	extend(
		proto: Record< string, unknown >,
		statics?: Record< string, unknown >
	): BackboneExtendable< Instance >;
}
interface WpMedia {
	( options: Record< string, unknown > ): MediaFrame;
	controller: {
		Library: BackboneExtendable< unknown >;
		Cropper: BackboneExtendable< unknown >;
	};
	query( opts: Record< string, unknown > ): unknown;
}
interface WpAjax {
	post( action: string, data: Record< string, unknown > ): JQueryPromise;
}
interface JQueryPromise {
	done( cb: ( response: unknown ) => void ): JQueryPromise;
	fail( cb: ( error: unknown ) => void ): JQueryPromise;
}
declare global {
	interface Window {
		wp?: { media?: WpMedia; ajax?: WpAjax };
	}
}

// --- public API ---------------------------------------------------------------

export interface CoverImagePickerOptions {
	onSelect( attachment: { id: number; url: string } ): void;
	onError( message: string ): void;
}

// Cached frame — wp.media frames are expensive to construct (they wire up
// jQuery, Backbone, and imgAreaSelect). Reuse across opens.
let cachedFrame: MediaFrame | null = null;
let cachedHandlers: CoverImagePickerOptions | null = null;

/**
 * Open the picker. Subsequent calls reuse the same wp.media frame and just
 * rebind callbacks, so behavior stays in sync with the latest React state.
 *
 * @param opts - onSelect/onError handlers, called from the frame's lifecycle events.
 */
export function openCoverImagePicker( opts: CoverImagePickerOptions ): void {
	const media = window.wp?.media;
	const ajax = window.wp?.ajax;
	if ( ! media || ! ajax ) {
		opts.onError(
			__( 'The media picker failed to load. Refresh the page and try again.', 'jetpack-podcast' )
		);
		return;
	}

	cachedHandlers = opts;

	if ( cachedFrame ) {
		cachedFrame.open();
		return;
	}

	const Cropper = media.controller.Cropper.extend( {
		// Backbone Model attributes — passed as the second extend arg or set
		// via the constructor. We define defaults so consumers don't have to.
		defaults: {
			id: 'cropper',
			title: __( 'Crop podcast cover', 'jetpack-podcast' ),
			toolbar: 'crop',
			content: 'crop',
			router: false,
			canSkipCrop: false,
		},

		// Returns options for jQuery imgAreaSelect. The base class doesn't
		// implement this — the view calls `controller.get('imgSelectOptions')`
		// and the result must lock the selection to 1:1.
		imgSelectOptions( attachment: AttachmentModel ): Record< string, unknown > {
			const realW = Number( attachment.get( 'width' ) ) || 0;
			const realH = Number( attachment.get( 'height' ) ) || 0;
			const initialSize = Math.min( realW, realH );
			const offsetX = Math.floor( ( realW - initialSize ) / 2 );
			const offsetY = Math.floor( ( realH - initialSize ) / 2 );
			// minimum crop box is 1400 unless the source itself is smaller (we
			// reject those before opening the cropper, but be defensive).
			const minSide = Math.min( COVER_TARGET_PX, initialSize );

			return {
				handles: true,
				keys: true,
				instance: true,
				persistent: true,
				imageWidth: realW,
				imageHeight: realH,
				minWidth: minSide,
				minHeight: minSide,
				x1: offsetX,
				y1: offsetY,
				x2: offsetX + initialSize,
				y2: offsetY + initialSize,
				aspectRatio: '1:1',
			};
		},

		// Override the base class's `custom-header-crop` post — we want the
		// generic `crop-image` endpoint with our own context so the resulting
		// attachment isn't tagged as a site icon.
		doCrop( attachment: AttachmentModel ): JQueryPromise {
			const cropDetails = attachment.get( 'cropDetails' ) as Record< string, number >;
			const nonces = attachment.get( 'nonces' ) as { edit?: string } | undefined;
			cropDetails.dst_width = COVER_TARGET_PX;
			cropDetails.dst_height = COVER_TARGET_PX;
			return ajax.post( 'crop-image', {
				nonce: nonces?.edit,
				id: attachment.get( 'id' ),
				context: 'jetpack-podcast-cover',
				cropDetails,
			} );
		},
	} );

	const frame = media( {
		button: { text: __( 'Crop and use', 'jetpack-podcast' ), close: false },
		states: [
			new media.controller.Library( {
				title: __( 'Select a podcast cover image', 'jetpack-podcast' ),
				library: media.query( { type: ALLOWED_MIME_TYPES } ),
				multiple: false,
				date: false,
				priority: 20,
				suggestedWidth: COVER_TARGET_PX,
				suggestedHeight: COVER_TARGET_PX,
			} ),
			new Cropper(),
		],
	} );

	// User picked an image in the Library state. Decide: skip the crop step
	// entirely (already square + large enough), bail with an error (too small),
	// or advance to the cropper.
	frame.on( 'select', () => {
		const attachment = frame.state().get( 'selection' ).first()?.toJSON();
		if ( ! attachment ) {
			return;
		}
		const width = Number( attachment.width ) || 0;
		const height = Number( attachment.height ) || 0;

		// Dimensions unknown — skip our gating and let the user proceed; the
		// server will reject genuinely malformed files.
		if ( ! width || ! height ) {
			frame.close();
			cachedHandlers?.onSelect( {
				id: Number( attachment.id ),
				url: String( attachment.url ),
			} );
			return;
		}

		if ( Math.min( width, height ) < COVER_TARGET_PX ) {
			cachedHandlers?.onError(
				__(
					'Cover images must be at least 1400×1400 pixels. Choose a larger image.',
					'jetpack-podcast'
				)
			);
			frame.close();
			return;
		}

		if ( width === height ) {
			frame.close();
			cachedHandlers?.onSelect( {
				id: Number( attachment.id ),
				url: String( attachment.url ),
			} );
			return;
		}

		frame.setState( 'cropper' );
	} );

	// Cropper finished — the AJAX response is wp_prepare_attachment_for_js()
	// output for the new attachment, which always carries `id` and `url`.
	frame.on( 'cropped', ( ...args: unknown[] ) => {
		const cropped = args[ 0 ] as { id?: number; url?: string } | undefined;
		if ( cropped?.id && cropped?.url ) {
			cachedHandlers?.onSelect( { id: cropped.id, url: cropped.url } );
		}
	} );

	// The server rejected the crop (size limit hit, GD error, etc).
	frame.on( 'content:error:crop', () => {
		cachedHandlers?.onError(
			__( 'The image could not be cropped. Try a different image.', 'jetpack-podcast' )
		);
	} );

	cachedFrame = frame;
	frame.open();
}

/**
 * Tear down the cached wp.media frame and detach listeners. Called from the
 * React component's unmount effect to avoid leaks across hot-reloads in dev.
 */
export function disposeCoverImagePicker(): void {
	cachedFrame?.off( 'select' );
	cachedFrame?.off( 'cropped' );
	cachedFrame?.off( 'content:error:crop' );
	cachedFrame = null;
	cachedHandlers = null;
}
