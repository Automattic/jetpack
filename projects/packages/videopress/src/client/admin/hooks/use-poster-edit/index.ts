/**
 * External dependencies
 */
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state';

const usePosterEdit = ( { video } ) => {
	const [ videoFrameMs, setVideoFrameMs ] = useState( null );
	const [ currentTime, setCurrentTime ] = useState( null );
	const [ frameSelectorIsOpen, setFrameSelectorIsOpen ] = useState( false );
	const dispatch = useDispatch( STORE_ID );

	const updatePosterImageFromFrame = () => {
		if ( ! Number.isFinite( videoFrameMs ) ) {
			return;
		}

		return dispatch?.updateVideoPoster( video.id, video.guid, {
			at_time: videoFrameMs,
			is_millisec: true,
		} );
	};

	const selectAttachmentFromLibrary = (): Promise< { id: number; url: string } | null > => {
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
				resolve( { id: selected?.id, url: selected?.url } );
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

	const updatePosterImageFromLibrary = async attachmentId => {
		if ( attachmentId == null ) {
			return;
		}

		return dispatch?.updateVideoPoster( video.id, video.guid, {
			poster_attachment_id: attachmentId,
		} );
	};

	const selectAndUpdatePosterImageFromLibrary = async () => {
		const attachment = await selectAttachmentFromLibrary();
		if ( ! attachment ) {
			return;
		}

		return updatePosterImageFromLibrary( attachment.id );
	};

	const handleConfirmFrame = () => {
		setVideoFrameMs( currentTime );
		setFrameSelectorIsOpen( false );
	};

	const handleVideoFrameSelected = time => {
		setCurrentTime( time );
	};

	return {
		handleConfirmFrame,
		handleCloseSelectFrame: () => setFrameSelectorIsOpen( false ),
		handleOpenSelectFrame: () => setFrameSelectorIsOpen( true ),
		handleVideoFrameSelected,
		useVideoAsThumbnail: videoFrameMs !== null,
		selectedTime: Number.isFinite( videoFrameMs ) ? videoFrameMs / 1000 : null,
		frameSelectorIsOpen,
		updatePosterImageFromFrame,
		selectAttachmentFromLibrary,
		updatePosterImageFromLibrary,
		selectAndUpdatePosterImageFromLibrary,
	};
};

export default usePosterEdit;
