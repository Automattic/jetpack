/**
 * External dependencies
 */
import { useState } from 'react';
/**
 * Internal dependencies
 */
import usePosterImage from '../../../hooks/use-poster-image';
import usePosterUpload from '../../../hooks/use-poster-upload';

const usePosterEdit = ( { video } ) => {
	const [ videoFrameMs, setVideoFrameMs ] = useState( null );
	const [ currentTime, setCurrentTime ] = useState( null );
	const [ frameSelectorIsOpen, setFrameSelectorIsOpen ] = useState( false );

	const posterUpload = usePosterUpload( video?.guid );
	const posterImage = usePosterImage( video?.guid );

	const posterImagePooling = ( onGenerate = null ) => {
		posterImage().then( ( { data: result } ) => {
			if ( result?.generating ) {
				setTimeout( () => posterImagePooling( onGenerate ), 2000 );
			} else if ( result?.poster ) {
				onGenerate?.( result?.poster );
			}
		} );
	};

	const updatePosterImage = () => {
		return new Promise( ( resolve, reject ) => {
			if ( Number.isFinite( videoFrameMs ) ) {
				posterUpload( { at_time: videoFrameMs, is_millisec: true } )
					.then( () => {
						posterImagePooling( resolve );
					} )
					.catch( reject );
			} else {
				resolve( null );
			}
		} );
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
		updatePosterImage,
	};
};

export default usePosterEdit;
