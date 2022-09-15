/**
 * External dependencies
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
/**
 * Internal dependencies
 */
import useMetaUpdate from '../../../hooks/use-meta-update';
import useVideo from '../../hooks/use-video';

export default () => {
	const { videoId: videoIdFromParams } = useParams();

	const videoId = Number( videoIdFromParams );
	const video = useVideo( Number( videoId ) );

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
	const updateMeta = useMetaUpdate( videoId );

	const handleSaveChanges = () => {
		updateMeta( data );
	};

	// Make sure we have the latest data from the API
	// Used to update the data when user navigates direct from Media Library
	useEffect( () => {
		setData( video );
	}, [ video ] );

	return {
		...video,
		...data, // override default data for the ones that are being edited
		setTitle,
		setDescription,
		setCaption,
		saveDisabled,
		handleSaveChanges,
	};
};
