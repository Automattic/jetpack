/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { IS_CURRENT_USER_CONNECTED_TO_WPCOM } from './constants';

export default function useConnectWpcom() {
	const { isAutoDraft } = useSelect( select => {
		const { status } = select( 'core/editor' ).getCurrentPost();
		return { isAutoDraft: 'auto-draft' === status };
	} );

	const { savePost } = useDispatch( 'core/editor' );

	const [ wpcomConnectUrl, setWpcomConnectUrl ] = useState();
	const [ isRequestingWpcomConnectUrl, setRequestingWpcomConnectUrl ] = useState( false );

	useEffect( () => {
		if ( IS_CURRENT_USER_CONNECTED_TO_WPCOM || wpcomConnectUrl || isRequestingWpcomConnectUrl ) {
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
	}, [ isAutoDraft, isRequestingWpcomConnectUrl, savePost, wpcomConnectUrl ] );

	return { isRequestingWpcomConnectUrl, wpcomConnectUrl };
}
