/**
 * External dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
/**
 * Internal dependencies
 */
import useMetaUpdate from '../../../hooks/use-meta-update';
import usePosterImage from '../../../hooks/use-poster-image';
import usePosterUpload from '../../../hooks/use-poster-upload';
import { STORE_ID } from '../../../state';
import useVideo from '../../hooks/use-video';

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
			if ( videoFrameMs ) {
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

	const handleVideoFrameSelected = ( time: number ) => {
		setCurrentTime( time );
	};

	return {
		handleConfirmFrame,
		handleCloseSelectFrame: () => setFrameSelectorIsOpen( false ),
		handleOpenSelectFrame: () => setFrameSelectorIsOpen( true ),
		handleVideoFrameSelected,
		useVideoAsThumbnail: videoFrameMs !== null,
		selectedTime: videoFrameMs ? videoFrameMs / 1000 : null,
		frameSelectorIsOpen,
		updatePosterImage,
	};
};

const useMetaEdit = ( { videoId, data, video, updateData } ) => {
	const updateMeta = useMetaUpdate( videoId );

	const metaChanged =
		data?.title !== video?.title ||
		data?.description !== video?.description ||
		data?.caption !== video?.caption;

	const setTitle = ( title: string ) => {
		updateData( { title } );
	};

	const setDescription = ( description: string ) => {
		updateData( { description } );
	};

	const setCaption = ( caption: string ) => {
		updateData( { caption } );
	};

	const handleMetaUpdate = () => {
		return new Promise( ( resolve, reject ) => {
			if ( metaChanged ) {
				updateMeta( data ).then( resolve ).catch( reject );
			} else {
				resolve( null );
			}
		} );
	};

	return {
		setTitle,
		setDescription,
		setCaption,
		handleMetaUpdate,
		metaChanged,
	};
};

export default () => {
	const navigate = useNavigate();
	const dispatch = useDispatch( STORE_ID );

	const { videoId: videoIdFromParams } = useParams();
	const videoId = Number( videoIdFromParams );
	const { data: video, isFetching } = useVideo( Number( videoId ) );

	const [ updating, setUpdating ] = useState( false );
	const [ data, setData ] = useState( video );

	const updateData = newData => {
		setData( current => ( { ...current, ...newData } ) );
	};

	const posterEditData = usePosterEdit( { video } );
	const metaEditData = useMetaEdit( { videoId, video, data, updateData } );

	const saveDisabled = metaEditData.metaChanged === false && posterEditData.selectedTime === null;

	const handleSaveChanges = () => {
		setUpdating( true );

		const promises = [ posterEditData.updatePosterImage(), metaEditData.handleMetaUpdate() ];

		// TODO: handle errors
		Promise.allSettled( promises ).then( results => {
			const [ posterResult ] = results;
			const posterImage = posterResult?.value ?? data?.posterImage;
			const videoData = { ...data, posterImage };

			setUpdating( false );
			dispatch?.setVideo( videoData );
			navigate( '/' );
		} );
	};
	// Make sure we have the latest data from the API
	// Used to update the data when user navigates direct from Media Library
	useEffect( () => {
		setData( video );
	}, [ video ] );

	return {
		...data, // data is the local representation of the video
		saveDisabled,
		handleSaveChanges,
		isFetching,
		updating,
		...metaEditData,
		...posterEditData,
	};
};
