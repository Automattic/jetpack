import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import isCurrentUserConnected from '../../shared/is-current-user-connected';

export default function useConnectWpcom() {
	const { isAutoDraft } = useSelect( select => {
		const { status } = select( 'core/editor' ).getCurrentPost();
		return { isAutoDraft: 'auto-draft' === status };
	} );

	const { savePost } = useDispatch( 'core/editor' );

	const [ wpcomConnectUrl, setWpcomConnectUrl ] = useState();
	const [ isRequestingWpcomConnectUrl, setRequestingWpcomConnectUrl ] = useState( false );

	const currentUserConnected = isCurrentUserConnected();

	useEffect( () => {
		if ( currentUserConnected || wpcomConnectUrl || isRequestingWpcomConnectUrl ) {
			return;
		}

		if ( isAutoDraft ) {
			savePost();
			return;
		}

		setRequestingWpcomConnectUrl( true );
		apiFetch( {
			path: addQueryArgs( '/jetpack/v4/connection/url', {
				from: 'jetpack-block-editor',
				redirect: window.location.href,
			} ),
		} ).then( connectUrl => {
			setWpcomConnectUrl( connectUrl );
			setRequestingWpcomConnectUrl( false );
		} );
	}, [
		currentUserConnected,
		isAutoDraft,
		isRequestingWpcomConnectUrl,
		savePost,
		wpcomConnectUrl,
	] );

	return { isRequestingWpcomConnectUrl, wpcomConnectUrl };
}
