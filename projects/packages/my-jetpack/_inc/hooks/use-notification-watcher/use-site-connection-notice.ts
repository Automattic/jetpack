import { useConnection } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import { useContext, useEffect } from 'react';
import { MyJetpackRoutes } from '../../constants';
import { NOTICE_PRIORITY_HIGH } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import { useAllProducts } from '../../data/products/use-product';
import getProductSlugsThatRequireUserConnection from '../../data/utils/get-product-slugs-that-require-user-connection';
import useMyJetpackConnection from '../use-my-jetpack-connection';
import useMyJetpackNavigate from '../use-my-jetpack-navigate';
import { getMyJetpackWindowRestState } from './../../data/utils/get-my-jetpack-window-state';

type RedBubbleAlerts = Window[ 'myJetpackInitialState' ][ 'redBubbleAlerts' ];

const useSiteConnectionNotice = ( redBubbleAlerts: RedBubbleAlerts ) => {
	const { setNotice, resetNotice } = useContext( NoticeContext );
	const { apiRoot, apiNonce } = getMyJetpackWindowRestState();
	const { isRegistered, isUserConnected, hasConnectedOwner } = useMyJetpackConnection();
	const { siteIsRegistering, handleRegisterSite } = useConnection( {
		skipUserConnection: true,
		apiRoot,
		apiNonce,
	} );
	const products = useAllProducts();
	const navToConnection = useMyJetpackNavigate( MyJetpackRoutes.Connection );

	useEffect( () => {
		if ( ! Object.keys( redBubbleAlerts ).includes( 'missing-site-connection' ) ) {
			return;
		}

		const productSlugsThatRequireUserConnection =
			getProductSlugsThatRequireUserConnection( products );
		const requiresUserConnection =
			! hasConnectedOwner && ! isUserConnected && productSlugsThatRequireUserConnection.length > 0;

		if ( ! requiresUserConnection && isRegistered ) {
			return;
		}

		const onActionButtonClick = () => {
			if ( requiresUserConnection ) {
				navToConnection();
			}

			handleRegisterSite().then( () => {
				resetNotice();
			} );
		};

		const oneProductMessage = sprintf(
			/* translators: placeholder is product name. */
			__(
				'Jetpack %s needs a user connection to WordPress.com to be able to work.',
				'jetpack-my-jetpack'
			),
			productSlugsThatRequireUserConnection[ 0 ]
		);

		const needsUserConnectionMessage =
			productSlugsThatRequireUserConnection.length === 1
				? oneProductMessage
				: __(
						'Some products need a user connection to WordPress.com to be able to work.',
						'jetpack-my-jetpack'
				  );

		const needsSiteConnectionMessage = __(
			'Some products need a connection to WordPress.com to be able to work.',
			'jetpack-my-jetpack'
		);

		const buttonLabel = requiresUserConnection
			? __( 'Connect your user account to fix this', 'jetpack-my-jetpack' )
			: __( 'Connect your site to fix this', 'jetpack-my-jetpack' );

		const noticeOptions = {
			status: 'warning',
			actions: [
				{
					label: buttonLabel,
					isLoading: siteIsRegistering,
					onClick: onActionButtonClick,
					noDefaultClasses: true,
				},
			],
			// If this notice gets into a loading state, we want to show it above the rest
			priority: NOTICE_PRIORITY_HIGH + ( siteIsRegistering ? 1 : 0 ),
			isRedBubble: true,
		};

		setNotice( {
			message: requiresUserConnection ? needsUserConnectionMessage : needsSiteConnectionMessage,
			options: noticeOptions,
		} );
	}, [
		handleRegisterSite,
		hasConnectedOwner,
		siteIsRegistering,
		isUserConnected,
		isRegistered,
		navToConnection,
		products,
		redBubbleAlerts,
		setNotice,
		resetNotice,
	] );
};

export default useSiteConnectionNotice;
