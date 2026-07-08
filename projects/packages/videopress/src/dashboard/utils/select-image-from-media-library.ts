import { __ } from '@wordpress/i18n';

type SelectImageLabels = {
	/** Media frame title. Defaults to the thumbnail-picker copy. */
	title?: string;
	/** Confirm-button text. Defaults to the thumbnail-picker copy. */
	buttonText?: string;
};

/**
 * Open the WordPress media library picker and prompt the user to select a
 * single image. Resolves with the chosen attachment's `id` and `url`, or
 * `null` when the user dismisses the dialog without making a selection.
 * Rejects if `window.wp.media` is unavailable (i.e. the classic-editor media
 * library script has not been enqueued).
 *
 * @param labels            - Optional frame copy overrides; the defaults suit
 *                          the video-thumbnail context this util was built for.
 * @param labels.title      - Media frame title.
 * @param labels.buttonText - Confirm-button text.
 * @return A Promise that resolves to the selected `{ id, url }` attachment, or `null` if the user closed the frame without selecting.
 */
export async function selectImageFromMediaLibrary( {
	title = __( 'Select thumbnail', 'jetpack-videopress-pkg' ),
	buttonText = __( 'Use this image as thumbnail', 'jetpack-videopress-pkg' ),
}: SelectImageLabels = {} ): Promise< WpMediaAttachment | null > {
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
		title,
		multiple: false,
		library: { type: 'image' },
		button: { text: buttonText },
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
