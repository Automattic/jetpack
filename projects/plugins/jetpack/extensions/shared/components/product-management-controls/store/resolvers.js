/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { addQueryArgs, getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	saveProduct,
	setApiState,
	setConnectUrl,
	setProducts,
	setShouldUpgrade,
	setSiteSlug,
} from './actions';
import { onError } from './utils';
import { API_STATE_CONNECTED, API_STATE_NOTCONNECTED } from '../constants';
import getConnectUrl from '../../../get-connect-url';

export const getProducts = ( selectedProductId = 0, setSelectedProductId = () => {} ) => async ( {
	dispatch,
	registry,
} ) => {
	const origin = getQueryArg( window.location.href, 'origin' );
	const path = addQueryArgs( '/wpcom/v2/memberships/status', {
		source: origin === 'https://wordpress.com' ? 'gutenberg-wpcom' : 'gutenberg',
	} );

	try {
		const response = await apiFetch( { path, method: 'GET' } );
		if ( ! response && typeof response !== 'object' ) {
			return;
		}
		const wpError = response?.errors && Object.values( response?.errors )?.[ 0 ]?.[ 0 ];
		if ( wpError ) {
			dispatch( setApiState( API_STATE_NOTCONNECTED ) );
			onError( wpError, registry );
			return;
		}

		const postId = registry.select( editorStore ).getCurrentPostId();

		dispatch( setConnectUrl( getConnectUrl( postId, response.connect_url ) ) );
		dispatch( setShouldUpgrade( response.should_upgrade_to_access_memberships ) );
		dispatch( setSiteSlug( response.site_slug ) );

		if (
			! response?.products?.length &&
			! response.should_upgrade_to_access_memberships &&
			response.connected_account_id
		) {
			// Is ready to use and has no product set up yet. Let's create one!
			await dispatch(
				saveProduct(
					{
						title: __( 'Monthly Subscription', 'jetpack' ),
						currency: 'USD',
						price: 5,
						interval: '1 month',
					},
					setSelectedProductId
				)
			);
			dispatch( setApiState( API_STATE_CONNECTED ) );
			return;
		}

		if ( response?.products?.length > 0 ) {
			dispatch( setProducts( response.products ) );
			if ( ! selectedProductId ) {
				setSelectedProductId( response.products[ 0 ].id );
			}
		}

		dispatch(
			setApiState( response.connected_account_id ? API_STATE_CONNECTED : API_STATE_NOTCONNECTED )
		);
	} catch ( error ) {
		dispatch( setConnectUrl( null ) );
		dispatch( setApiState( API_STATE_NOTCONNECTED ) );
		onError( error.message, registry );
	}
};
