import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SOURCE_GOOGLE_PHOTOS } from '../../constants';
import { getApiUrl } from '../api';

const GooglePhotosDisconnect = ( { setAuthenticated } ) => {
	const [ isDisconnecting, setIsDisconnecting ] = useState( false );

	const onDisconnect = useCallback( () => {
		setIsDisconnecting( true );

		apiFetch( {
			method: 'DELETE',
			path: getApiUrl( 'connection', SOURCE_GOOGLE_PHOTOS ),
		} )
			.then( () => setAuthenticated( false ) )
			.catch( () => setIsDisconnecting( false ) );
	}, [ setAuthenticated ] );

	return (
		<Button
			variant="secondary"
			className="jetpack-external-media-browser__disconnect"
			onClick={ onDisconnect }
			disabled={ isDisconnecting }
			isBusy={ isDisconnecting }
		>
			{ __( 'Disconnect from Google Photos', 'jetpack' ) }
		</Button>
	);
};

export default GooglePhotosDisconnect;
