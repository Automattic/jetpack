import { __, sprintf } from '@wordpress/i18n';
import { useContext, useEffect } from 'react';
import { MyJetpackRoutes } from '../../constants';
import { NOTICE_PRIORITY_HIGH } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import { useAllProducts } from '../../data/products/use-product';
import getProductSlugsThatRequireUserConnection from '../../data/utils/get-product-slugs-that-require-user-connection';
import useMyJetpackNavigate from '../use-my-jetpack-navigate';

type RedBubbleAlerts = Window[ 'myJetpackInitialState' ][ 'redBubbleAlerts' ];

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

		const noticeOptions = {
			level: 'warning',
			actions: [
				{
					label: __( 'Connect your user account to fix this', 'jetpack-my-jetpack' ),
					onClick: navToConnection,
					noDefaultClasses: true,
				},
			],
			priority: NOTICE_PRIORITY_HIGH,
			isRedBubble: true,
		};

		setNotice( {
			message: needsUserConnectionMessage,
			options: noticeOptions,
		} );
	}, [ navToConnection, products, redBubbleAlerts, setNotice ] );
};

export default useSiteConnectionNotice;
