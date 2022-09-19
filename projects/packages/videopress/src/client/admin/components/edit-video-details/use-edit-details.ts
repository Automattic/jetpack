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

export default () => {
	const navigate = useNavigate();
	const dispatch = useDispatch( STORE_ID );
	const [ videoFrameMs, setVideoFrameMs ] = useState( null );
	const { videoId: videoIdFromParams } = useParams();
	const videoId = Number( videoIdFromParams );

	const video = useVideo( Number( videoId ) );
	const updateMeta = useMetaUpdate( videoId );
	const posterUpload = usePosterUpload( video?.videopress_guid?.[ 0 ] );
	const posterImage = usePosterImage( video?.videopress_guid?.[ 0 ] );

	const [ updating, setUpdating ] = useState( false );
	const [ data, setData ] = useState( video );

	const saveDisabled =
		data?.title === video?.title &&
		data?.description === video?.description &&
		data?.caption === video?.caption;

	const setTitle = ( title: string ) => {
		setData( { ...data, title } );
	};

	const setDescription = ( description: string ) => {
		setData( { ...data, description } );
	};

	const setCaption = ( caption: string ) => {
		setData( { ...data, caption } );
	};

	const handleSaveChanges = () => {
		setUpdating( true );
		updateMeta( data )
			.then( () => {
				dispatch?.setVideo( data );
				navigate( '/' );
			} )
			.catch( () => {
				setUpdating( false );
				// TODO: provide feedback for user
			} );
	};

	const posterImagePooling = () => {
		posterImage().then( ( { data: result } ) => {
			if ( result?.generating ) {
				setTimeout( posterImagePooling, 2000 );
			} else if ( result?.poster ) {
				// TODO
			}
		} );
	};

	const handleSelectFrame = () => {
		posterUpload( { at_time: videoFrameMs, is_millisec: true } ).then( () => {
			posterImagePooling();
		} );
	};

	// Make sure we have the latest data from the API
	// Used to update the data when user navigates direct from Media Library
	useEffect( () => {
		setData( video );
	}, [ video ] );

	return {
		...data, // data is the local representation of the video
		setTitle,
		setDescription,
		setCaption,
		saveDisabled,
		handleSaveChanges,
		updating,
		setVideoFrameMs,
		handleSelectFrame,
	};
};
