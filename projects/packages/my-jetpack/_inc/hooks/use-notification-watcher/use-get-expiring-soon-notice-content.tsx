import { Col, Text } from '@automattic/jetpack-components';
import { gmdateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { ProductsList } from './products-list';

type RedBubbleAlerts = Window[ 'myJetpackInitialState' ][ 'redBubbleAlerts' ];

export const useGetExpiringSoonNoticeContent = ( {
	product_slug,
	product_name,
	expiry_date,
	products_effected,
}: RedBubbleAlerts[ `${ string }--plan_expiring_soon` ] ) => {
	if ( ! product_slug ) {
		return null;
	}

	// Remove the billing term suffix from the purchase product_slug. The notice will be the same regardless of the expiring product's billing term.
	const productSlug = product_slug.replace( /(?:_t1|_t2|_bi)?(?:_yearly|_monthly)/, '' );
	const formattedExpiryDate = gmdateI18n( 'M j, Y', expiry_date );

	switch ( productSlug ) {
		case 'jetpack_videopress':
			return {
				noticeTitle: sprintf(
					// translators: %1$s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc..
					__( 'Heads up! Your %1$s plan is about to expire', 'jetpack-my-jetpack' ),
					product_name
				),
				noticeMessage: (
					<Col>
						<Text mt={ 2 } mb={ 2 }>
							{ __(
								'Your videos will soon stop showing for your viewers, and you won’t be able to upload new content.',
								'jetpack-my-jetpack'
							) }
						</Text>
						<Text mb={ 2 }>
							{ sprintf(
								// translators: %1$s is the product's expiration date, i.e.- "Nov 11, 2024"
								__(
									'To keep everything running smoothly, renew your plan by %1$s!',
									'jetpack-my-jetpack'
								),
								formattedExpiryDate
							) }
						</Text>
					</Col>
				),
				learnMoreUrl:
					'https://jetpack.com/support/jetpack-videopress/#canceled-or-expired-videopress-plan',
			};
		case 'jetpack_complete':
		case 'jetpack_security':
		case 'jetpack_growth':
			return {
				noticeTitle: sprintf(
					// translators: %1$s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc..
					__( 'Heads up! Your %1$s plan is about to expire', 'jetpack-my-jetpack' ),
					product_name
				),
				noticeMessage: (
					<Col>
						<Text mt={ 2 }>
							{ sprintf(
								// translators: %1$s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc..
								__(
									'%1$s provides paid features for the following products:',
									'jetpack-my-jetpack'
								),
								product_name
							) }
						</Text>

						<ProductsList products={ products_effected } />

						<Text mb={ 2 }>
							{ sprintf(
								// translators: %1$s is the product's expiration date, i.e.- "Nov 11, 2024"
								__(
									'Renew your plan by %1$s to continue to have access to the paid features of these products.',
									'jetpack-my-jetpack'
								),
								formattedExpiryDate
							) }
						</Text>
					</Col>
				),
				learnMoreUrl: 'https://jetpack.com/support/jetpack-billing-payments/',
			};
		default:
			return {
				noticeTitle: sprintf(
					// translators: %1$s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc..
					__( 'Heads up! Your %1$s plan is about to expire', 'jetpack-my-jetpack' ),
					product_name
				),
				noticeMessage: (
					<Col>
						<Text mt={ 2 } mb={ 2 }>
							{ sprintf(
								// translators: %1$s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc.., %2$s is the product's expiration date, i.e.- "Nov 11, 2024".
								__(
									'Your %1$s subcription will be expiring soon on %2$s, and the paid features for this product will no longer be available.',
									'jetpack-my-jetpack'
								),
								product_name,
								formattedExpiryDate
							) }
						</Text>
						<Text mb={ 2 }>
							{ __(
								'To keep everything running smoothly, renew your plan today!',
								'jetpack-my-jetpack'
							) }
						</Text>
					</Col>
				),
				learnMoreUrl: 'https://jetpack.com/support/jetpack-billing-payments/',
			};
	}
};
