import { Col, Text } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { ProductsList } from './products-list';

type RedBubbleAlerts = Window[ 'myJetpackInitialState' ][ 'redBubbleAlerts' ];

export const useGetExpiredNoticeContent = ( {
	product_slug,
	product_name,
	products_effected = [],
}: RedBubbleAlerts[ `${ string }--plan_expired` ] ) => {
	if ( ! product_slug ) {
		return null;
	}

	// Remove the billing term suffix from the purchase product_slug. The notice will be the same regardless of the expired product's billing term.
	const productSlug = product_slug.replace( /(?:_t1|_t2|_bi)?(?:_yearly|_monthly)/, '' );

	switch ( productSlug ) {
		case 'jetpack_videopress':
			return {
				noticeTitle: sprintf(
					// translators: %s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc..
					__( 'Your %1$s plan has expired', 'jetpack-my-jetpack' ),
					product_name
				),
				noticeMessage: (
					<Col>
						<Text mt={ 2 } mb={ 2 }>
							{ __(
								'Your videos are no longer visible to your viewers, and you won’t be able to upload new content.',
								'jetpack-my-jetpack'
							) }
						</Text>
						<Text mb={ 2 }>
							{ __(
								'Don’t worry—you can resume your plan anytime to restore your video library and continue uploading.',
								'jetpack-my-jetpack'
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
					__( 'Your %1$s plan has expired', 'jetpack-my-jetpack' ),
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
								// translators: %1$s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc..
								__(
									'Since your %1$s plan is expired, the paid features for these products are no longer available for your site.',
									'jetpack-my-jetpack'
								),
								product_name
							) }
						</Text>
						<Text mb={ 2 }>
							{ __(
								'But don’t worry—you can resume your plan to restore your access to your plan’s paid features.',
								'jetpack-my-jetpack'
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
					__( 'Your %1$s plan has expired', 'jetpack-my-jetpack' ),
					product_name
				),
				noticeMessage: (
					<Col>
						<Text mt={ 2 } mb={ 2 }>
							{ sprintf(
								// translators: %1$s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc..
								__(
									'Your %1$s subcription has expired. The paid features are no longer available.',
									'jetpack-my-jetpack'
								),
								product_name
							) }
						</Text>
						<Text mb={ 2 }>
							{ __(
								'Don’t worry—you can resume your plan anytime to restore your access to the upgraded features.',
								'jetpack-my-jetpack'
							) }
						</Text>
					</Col>
				),
				learnMoreUrl: 'https://jetpack.com/support/jetpack-billing-payments/',
			};
	}
};
