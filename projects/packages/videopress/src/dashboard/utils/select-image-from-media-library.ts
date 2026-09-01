import { __ } from '@wordpress/i18n';

/**
 * Open the WordPress media library picker and prompt the user to select a
 * single image. Resolves with the chosen attachment's `id` and `url`, or
 * `null` when the user dismisses the dialog without making a selection.
 * Rejects if `window.wp.media` is unavailable (i.e. the classic-editor media
 * library script has not been enqueued).
 *
 * @return A Promise that resolves to the selected `{ id, url }` attachment, or `null` if the user closed the frame without selecting.
 */
export async function selectImageFromMediaLibrary(): Promise< WpMediaAttachment | null > {
	const mediaFactory = ( window.wp as WpGlobal | undefined )?.media as
		| ( ( opts: {
				title: string;
				multiple: boolean;
				library: { type: string };
				button: { text: string };
		  } ) => WpMediaFrame )
		| undefined;

	if ( ! mediaFactory ) {
		throw new Error( 'wp.media is not available' );
	}
	const frame = mediaFactory( {
		title: __( 'Select thumbnail', 'jetpack-videopress-pkg' ),
		multiple: false,
		library: { type: 'image' },
		button: { text: __( 'Use this image as thumbnail', 'jetpack-videopress-pkg' ) },
	} );

	return new Promise( resolve => {
		let resolved = false;
		frame.on( 'select', () => {
			resolved = true;
			const sel = frame.state().get( 'selection' ).first().toJSON();
			resolve( { id: sel.id, url: sel.url } );
		} );
		frame.on( 'close', () => {
			// When the user confirms, wp.media fires `select` then `close` in the same
			// tick. Deferring the null-resolve lets the `select` handler win; the
			// `resolved` flag is the real guard against close overwriting the result.
			setTimeout( () => {
				if ( ! resolved ) {
					resolve( null );
				}
			}, 0 );
		} );
		frame.open();
	} );
}
