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
import useAnalytics from '../use-analytics';
import useMyJetpackNavigate from '../use-my-jetpack-navigate';

type RedBubbleAlerts = Window[ 'myJetpackInitialState' ][ 'redBubbleAlerts' ];

const useSiteConnectionNotice = ( redBubbleAlerts: RedBubbleAlerts ) => {
	const { recordEvent } = useAnalytics();
	const { setNotice, resetNotice } = useContext( NoticeContext );
	const { apiRoot, apiNonce } = getMyJetpackWindowRestState();
	const { siteIsRegistering, handleRegisterSite } = useConnection( {
		skipUserConnection: true,
		apiRoot,
		apiNonce,
		from: 'my-jetpack',
		redirectUri: null,
		autoTrigger: false,
	} );
	const products = useAllProducts();
	const navToConnection = useMyJetpackNavigate( MyJetpackRoutes.Connection );
	const connectionErrorType = redBubbleAlerts[ 'missing-connection' ];

	useEffect( () => {
		if ( ! connectionErrorType ) {
			return;
		}

		const productSlugsThatRequireUserConnection =
			getProductSlugsThatRequireUserConnection( products );
		const requiresUserConnection = connectionErrorType === 'user';

		const onActionButtonClick = () => {
			if ( requiresUserConnection ) {
				recordEvent( 'jetpack_my_jetpack_user_connection_notice_cta_click' );
				navToConnection();
			}

			recordEvent( 'jetpack_my_jetpack_site_connection_notice_cta_click' );
			handleRegisterSite().then( () => {
				resetNotice();
				setNotice( {
					message: __( 'Your site has been successfully connected.', 'jetpack-my-jetpack' ),
					options: {
						id: 'site-connection-success-notice',
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
			id: requiresUserConnection ? 'user-connection-notice' : 'site-connection-notice',
			level: 'error',
			actions: [
				{
					label: requiresUserConnection
						? userConnectionContent.buttonLabel
						: siteConnectionContent.buttonLabel,
					isLoading: siteIsRegistering,
					loadingText: __( 'Connecting…', 'jetpack-my-jetpack' ),
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
		navToConnection,
		products,
		recordEvent,
		redBubbleAlerts,
		resetNotice,
		setNotice,
		siteIsRegistering,
		connectionErrorType,
	] );
};

export default useSiteConnectionNotice;
