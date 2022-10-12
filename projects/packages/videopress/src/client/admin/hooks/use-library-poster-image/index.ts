/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import usePosterUpload from '../../../hooks/use-poster-upload';

interface MediaWindow extends Window {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	wp: { media: any };
}

declare let window: MediaWindow;

const useLibraryPosterImage = ( { video } ) => {
	const posterUpload = usePosterUpload( video?.guid );

	const selectAttachmentId = () => {
		return new Promise( resolve => {
			const mediaFrame = window.wp.media( {
				title: __( 'Select Thumbnail', 'jetpack-videopress-pkg' ),
				multiple: false,
				library: {
					type: 'image',
				},
				button: {
					text: __( 'Use this image as thumbnail', 'jetpack-videopress-pkg' ),
				},
			} );

			mediaFrame.on( 'select', function () {
				const selected = mediaFrame?.state()?.get( 'selection' )?.first()?.toJSON();
				resolve( selected?.id );
			} );

			mediaFrame.on( 'close', function () {
				// 'close' is emitted before 'select'
				setTimeout( () => {
					resolve( null );
				}, 0 );
			} );

			mediaFrame.open();
		} );
	};

	const updatePosterImage = async () => {
		const attachmentId = await selectAttachmentId();

		if ( attachmentId === null ) {
			return;
		}

		const response = await posterUpload( { poster_attachment_id: attachmentId } );
		return response?.data?.poster;
	};

	return {
		selectAttachmentId,
		updatePosterImage,
	};
};

export default useLibraryPosterImage;
