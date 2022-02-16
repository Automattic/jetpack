/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useMemo } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';
import { PRODUCT_STATUSES } from '../../components/product-card';
import useMyJetpackConnection from '../use-my-jetpack-connection';
import useMyJetpackNavigate from '../use-my-jetpack-navigate';

const getProductsWithRequires = products => {
	return Object.keys( products ).reduce( ( current, product ) => {
		const currentProduct = products[ product ];
		const requires =
			currentProduct?.requiresUserConnection &&
			( currentProduct?.status === PRODUCT_STATUSES.ACTIVE ||
				currentProduct?.status === PRODUCT_STATUSES.ERROR );
		if ( requires ) {
			current.push( currentProduct?.name );
		}
		return current;
	}, [] );
};

/**
 * React custom hook to watch connection.
 * For instance, when the user is not connected,
 * the hook dispatches an action to populate the global notice.
 */
export default function useConnectionWatcher() {
	const navToConnection = useMyJetpackNavigate( '/connection' );
	const { setGlobalNotice } = useDispatch( STORE_ID );
	const products = useSelect( select => select( STORE_ID ).getProducts() );
	const { isSiteConnected, redirectUrl, hasConnectedOwner } = useMyJetpackConnection();
	const productsThatRequiresUserConnection = useMemo( () => getProductsWithRequires( products ), [
		products,
	] );
	const requiresUserConnection =
		! hasConnectedOwner && productsThatRequiresUserConnection.length > 0;

	/*
	 * When the site is not connect, redirect to the Jetpack dashboard.
	 */
	useEffect( () => {
		if ( ! isSiteConnected && redirectUrl ) {
			window.location = redirectUrl;
		}
	}, [ isSiteConnected, redirectUrl ] );

	useEffect( () => {
		if ( requiresUserConnection ) {
			const oneProductMessage = sprintf(
				/* translators: placeholder is product name. */
				__(
					'Jetpack %s needs a user connection to WordPress.com to be able to work.',
					'jetpack-my-jetpack'
				),
				productsThatRequiresUserConnection[ 0 ]
			);

			const message =
				productsThatRequiresUserConnection.length > 1
					? __(
							'Some products need a user connection to WordPress.com to be able to work.',
							'jetpack-my-jetpack'
					  )
					: oneProductMessage;

			setGlobalNotice( message, {
				status: 'error',
				actions: [
					{
						label: __( 'Connect your user account to fix this', 'jetpack-my-jetpack' ),
						onClick: navToConnection,
						variant: 'link',
						noDefaultClasses: true,
					},
				],
			} );
		}
	}, [ productsThatRequiresUserConnection, requiresUserConnection, navToConnection, setGlobalNotice ] );
}
