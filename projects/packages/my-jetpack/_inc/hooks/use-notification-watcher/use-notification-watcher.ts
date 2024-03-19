import { __, sprintf } from '@wordpress/i18n';
import { useContext, useEffect } from 'react';
import { MyJetpackRoutes } from '../../constants';
import { NOTICE_PRIORITY_MEDIUM, NOTICE_PRIORITY_HIGH } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import { useAllProducts } from '../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import getProductSlugsThatRequireUserConnection from '../../data/utils/get-product-slugs-that-require-user-connection';
import useMyJetpackNavigate from '../use-my-jetpack-navigate';

type RedBubbleAlerts = Window[ 'myJetpackInitialState' ][ 'redBubbleAlerts' ];

const useNotificationWatcher = () => {
	const { redBubbleAlerts } = getMyJetpackWindowInitialState();

	useBadInstallNotice( redBubbleAlerts );
	useSiteConnectionNotice( redBubbleAlerts );
};

export default useNotificationWatcher;

const useSiteConnectionNotice = ( redBubbleAlerts: RedBubbleAlerts ) => {
	const { setNotice } = useContext( NoticeContext );
	const products = useAllProducts();
	const navToConnection = useMyJetpackNavigate( MyJetpackRoutes.Connection );

	useEffect( () => {
		if ( ! Object.keys( redBubbleAlerts ).includes( 'missing-site-connection' ) ) {
			return;
		}

		const productSlugsThatRequireUserConnection =
			getProductSlugsThatRequireUserConnection( products );

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

		setNotice( {
			message: needsUserConnectionMessage,
			options: {
				status: 'warning',
				actions: [
					{
						label: __( 'Connect your user account to fix this', 'jetpack-my-jetpack' ),
						onClick: navToConnection,
						noDefaultClasses: true,
					},
				],
			},
			priority: NOTICE_PRIORITY_HIGH,
		} );
	}, [ navToConnection, products, redBubbleAlerts, setNotice ] );
};

const useBadInstallNotice = ( redBubbleAlerts: RedBubbleAlerts ) => {
	const { setNotice } = useContext( NoticeContext );

	useEffect( () => {
		const badInstallAlerts = Object.keys( redBubbleAlerts ).filter( key =>
			key.endsWith( '-bad-installation' )
		) as Array< ` ${ string }-bad-installation` >;

		if ( badInstallAlerts.length === 0 ) {
			return;
		}

		const alert = redBubbleAlerts[ badInstallAlerts[ 0 ] ];
		const { plugin } = alert.data;
		const devEnvUrl =
			'https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md';

		const errorMessagae = sprintf(
			// translators: %s is the name of the plugin that has a bad installation.
			__(
				'Your installation of %1$s is incomplete. If you installed %1$s from GitHub, please refer to the developer documentation to set up your development environment.',
				'jetpack-my-jetpack'
			),
			plugin
		);

		const noticeOptions = {
			status: 'error',
			actions: [
				{
					label: __( 'See documentation', 'jetpack-my-jetpack' ),
					onClick: () => {
						window.open( devEnvUrl );
					},
					noDefaultClasses: true,
				},
			],
		};

		setNotice( {
			message: errorMessagae,
			options: noticeOptions,
			priority: NOTICE_PRIORITY_MEDIUM,
		} );
	}, [ redBubbleAlerts, setNotice ] );
};
