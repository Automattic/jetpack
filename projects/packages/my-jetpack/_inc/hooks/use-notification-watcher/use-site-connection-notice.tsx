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
						status: 'success',
						actions: [
							{
								label: __( 'Close', 'jetpack-my-jetpack' ),
								onClick: resetNotice,
								noDefaultClasses: true,
							},
						],
						priority: NOTICE_PRIORITY_HIGH,
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

		const userConnectionButtonLabel = __(
			'Connect your user account to fix this',
			'jetpack-my-jetpack'
		);
		const siteConnectionButtonLabel = __( 'Connect your site', 'jetpack-my-jetpack' );

		const noticeOptions = {
			status: 'warning',
			actions: [
				{
					label: requiresUserConnection ? userConnectionButtonLabel : siteConnectionButtonLabel,
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
			<Col>{ needsUserConnectionMessage }</Col>
		) : (
			<Col>
				<Text variant="title-medium" mb={ 3 }>
					{ __( 'Missing site connection', 'jetpack-my-jetpack' ) }
				</Text>
				<Text mb={ 2 }>{ needsSiteConnectionMessage }</Text>
				<Text variant="body-extra-small">
					<TermsOfService agreeButtonLabel={ siteConnectionButtonLabel } />
				</Text>
			</Col>
		);

		setNotice( {
			message: messageContent,
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
