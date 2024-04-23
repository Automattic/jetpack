import { Col, TermsOfService, Text } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import { useContext, useEffect } from 'react';
import { MyJetpackRoutes } from '../../constants';
import { NOTICE_PRIORITY_HIGH } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import { useAllProducts } from '../../data/products/use-product';
import { getMyJetpackWindowRestState } from '../../data/utils/get-my-jetpack-window-state';
import getProductSlugsThatRequireUserConnection from '../../data/utils/get-product-slugs-that-require-user-connection';
import useMyJetpackConnection from '../use-my-jetpack-connection';
import useMyJetpackNavigate from '../use-my-jetpack-navigate';

type RedBubbleAlerts = Window[ 'myJetpackInitialState' ][ 'redBubbleAlerts' ];

const useSiteConnectionNotice = ( redBubbleAlerts: RedBubbleAlerts ) => {
	const { setNotice, resetNotice } = useContext( NoticeContext );
	const { apiRoot, apiNonce } = getMyJetpackWindowRestState();
	const { isRegistered, isUserConnected, hasConnectedOwner } = useMyJetpackConnection();
	const { siteIsRegistering, handleRegisterSite } = useConnection( {
		skipUserConnection: true,
		apiRoot,
		apiNonce,
		from: 'my-jetpack',
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
				setNotice( {
					message: __( 'Your site has been successfully connected.', 'jetpack-my-jetpack' ),
					options: {
						level: 'success',
						actions: [],
						priority: NOTICE_PRIORITY_HIGH,
						hideCloseButton: false,
						onClose: resetNotice,
					},
				} );
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

		const userConnectionContent = {
			message:
				productSlugsThatRequireUserConnection.length === 1
					? oneProductMessage
					: __(
							'Some products need a user connection to WordPress.com to be able to work.',
							'jetpack-my-jetpack'
					  ),
			buttonLabel: __( 'Connect your user account', 'jetpack-my-jetpack' ),
			title: __( 'Missing user connection', 'jetpack-my-jetpack' ),
		};

		const siteConnectionContent = {
			message: __(
				'Some products need a connection to WordPress.com to be able to work.',
				'jetpack-my-jetpack'
			),
			buttonLabel: __( 'Connect your site', 'jetpack-my-jetpack' ),
			title: __( 'Missing site connection', 'jetpack-my-jetpack' ),
		};

		const noticeOptions = {
			level: 'info',
			actions: [
				{
					label: requiresUserConnection
						? userConnectionContent.buttonLabel
						: siteConnectionContent.buttonLabel,
					isLoading: siteIsRegistering,
					loadingText: __( 'Conecting…', 'jetpack-my-jetpack' ),
					onClick: onActionButtonClick,
					noDefaultClasses: true,
				},
			],
			// If this notice gets into a loading state, we want to show it above the rest
			priority: NOTICE_PRIORITY_HIGH + ( siteIsRegistering ? 1 : 0 ),
			isRedBubble: true,
		};

		const messageContent = requiresUserConnection ? (
			userConnectionContent.message
		) : (
			<Col>
				<Text mb={ 2 }>{ siteConnectionContent.message }</Text>
				<TermsOfService agreeButtonLabel={ siteConnectionContent.buttonLabel } />
			</Col>
		);

		setNotice( {
			message: messageContent,
			title: requiresUserConnection ? userConnectionContent.title : siteConnectionContent.title,
			options: noticeOptions,
		} );
	}, [
		handleRegisterSite,
		hasConnectedOwner,
		isRegistered,
		isUserConnected,
		navToConnection,
		products,
		redBubbleAlerts,
		resetNotice,
		setNotice,
		siteIsRegistering,
	] );
};

export default useSiteConnectionNotice;
