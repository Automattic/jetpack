/**
 * External dependencies
 */
import { useConnection } from '@automattic/jetpack-connection';
import { useDispatch } from '@wordpress/data';
import { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
/**
 * Internal dependencies
 */
import useMetaUpdate from '../../../hooks/use-meta-update';
import { STORE_ID } from '../../../state';
import usePlaybackToken from '../../hooks/use-playback-token';
import usePosterEdit from '../../hooks/use-poster-edit';
import useVideo from '../../hooks/use-video';

const useMetaEdit = ( { videoId, formData, video, updateData } ) => {
	const updateMeta = useMetaUpdate( videoId );

	const isEmpty = value => {
		return value === undefined || value === '';
	};

	const hasFieldChanged = field => {
		const formDataField = formData?.[ field ];
		const videoField = video?.[ field ];
		const isDifferent = formDataField !== videoField;
		return ! ( isEmpty( formDataField ) && isEmpty( videoField ) ) && isDifferent;
	};

	const metaChanged = [ 'title', 'description', 'caption' ].some( field =>
		hasFieldChanged( field )
	);

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
				updateMeta( formData ).then( resolve ).catch( reject );
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
	const history = useHistory();
	const dispatch = useDispatch( STORE_ID );
	const { isRegistered } = useConnection();

	if ( ! isRegistered ) {
		history.push( '/' );
	}

	const { videoId: videoIdFromParams } = useParams();
	const videoId = Number( videoIdFromParams );
	const { data: video, isFetching, processing } = useVideo( Number( videoId ) );

	const { playbackToken, isFetchingPlaybackToken } = usePlaybackToken( video );

	const [ libraryAttachment, setLibraryAttachment ] = useState( null );
	const [ posterImageSource, setPosterImageSource ] = useState<
		'default' | 'video' | 'upload' | null
	>( null );

	const [ updating, setUpdating ] = useState( false );
	const [ updated, setUpdated ] = useState( false );

	const [ formData, setFormData ] = useState( {
		title: video?.title,
		description: video?.description,
		caption: video?.caption,
	} );

	const updateData = newData => {
		setFormData( current => ( { ...current, ...newData } ) );
	};

	const {
		selectedTime,

		updatePosterImageFromFrame,

		selectAttachmentFromLibrary,
		updatePosterImageFromLibrary,
		...posterEditData
	} = usePosterEdit( { video } );
	const { metaChanged, handleMetaUpdate, ...metaEditData } = useMetaEdit( {
		videoId,
		video,
		formData,
		updateData,
	} );

	useEffect( () => {
		if ( selectedTime == null ) {
			return;
		}

		setPosterImageSource( 'video' );
	}, [ selectedTime ] );

	const hasChanges = metaChanged || selectedTime != null || libraryAttachment != null;

	const selectPosterImageFromLibrary = async () => {
		const attachment = await selectAttachmentFromLibrary();

		if ( attachment ) {
			setLibraryAttachment( attachment );
			setPosterImageSource( 'upload' );
		}
	};

	const handleSaveChanges = () => {
		setUpdating( true );

		const promises = [ handleMetaUpdate() ];

		if ( posterImageSource === 'video' ) {
			promises.push( updatePosterImageFromFrame() );
		} else if ( posterImageSource === 'upload' ) {
			promises.push( updatePosterImageFromLibrary( libraryAttachment.id ) );
		}

		// TODO: handle errors
		Promise.allSettled( promises ).then( () => {
			const videoData = { ...video, ...formData };
			// posterImage already set by the action
			delete videoData.posterImage;

			setUpdating( false );
			dispatch?.setVideo( videoData );
			setUpdated( true );
		} );
	};

	// Update the data when user enter directly to the edit page
	// This moment we fetch the video data and update after fetching

	const initialLoading =
		isFetching &&
		formData?.title === undefined &&
		formData?.description === undefined &&
		formData?.caption === undefined;

	useEffect( () => {
		let mounted = true;

		if ( ! initialLoading && mounted ) {
			setFormData( {
				title: video?.title,
				description: video?.description,
				caption: video?.caption,
			} );
		}

		// Avoid updating state if component is unmounted
		// From: https://reactjs.org/docs/hooks-faq.html#is-it-safe-to-omit-functions-from-the-list-of-dependencies
		return () => {
			mounted = false;
		};
	}, [ initialLoading ] );

	return {
		playbackToken,
		isFetchingPlaybackToken,
		...video,
		...formData, // formData is the local representation of the video
		hasChanges,
		posterImageSource,
		libraryAttachment,
		selectPosterImageFromLibrary,
		handleSaveChanges,
		isFetching,
		processing,
		updating,
		updated,
		selectedTime,
		...metaEditData,
		...posterEditData,
	};
};
