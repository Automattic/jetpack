import { gmdateI18n } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

type RedBubbleAlerts = Window[ 'myJetpackInitialState' ][ 'redBubbleAlerts' ];

export const useGetExpiringSoonNoticeContent = ( {
	product_slug,
	product_name,
	expiry_date,
}: RedBubbleAlerts[ `${ string }--plan_expiring_soon` ] ) => {
	if ( ! product_slug ) {
		return null;
	}
	// Remove the billing term suffix from the purchase product_slug. The notice will be the same regardless of the expiring product's billing term.
	const productSlug = product_slug.replace( /(_yearly|_monthly)/, '' );
	const formattedExpiryDate = gmdateI18n( 'M j, Y', expiry_date );

	switch ( productSlug ) {
		case 'jetpack_videopress':
			return {
				noticeTitle: sprintf(
					// translators: %1$s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc..
					__( 'Heads up! Your %1$s plan is about to expire', 'jetpack-my-jetpack' ),
					product_name
				),
				noticeMessage: createInterpolateElement(
					__(
						'Your videos will soon stop showing for your viewers, and you won’t be able to upload new content.<br/>' +
							'To keep everything running smoothly, renew your plan today!',
						'jetpack-my-jetpack'
					),
					{
						br: <br />,
					}
				),
				learnMoreUrl:
					'https://jetpack.com/support/jetpack-videopress/#canceled-or-expired-videopress-plan',
			};
		default:
			return {
				noticeTitle: sprintf(
					// translators: %1$s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc..
					__( 'Heads up! Your %1$s plan is about to expire', 'jetpack-my-jetpack' ),
					product_name
				),
				noticeMessage: createInterpolateElement(
					sprintf(
						// translators: %1$s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc.., %2$s is the product's expiration date, i.e.- "Nov 11, 2024".
						__(
							'Your %1$s subcription will be expiring soon on %2$s. Your paid features will no longer be available.<br />' +
								'To keep everything running smoothly, renew your plan today!',
							'jetpack-my-jetpack'
						),
						product_name,
						formattedExpiryDate
					),
					{
						br: <br />,
					}
				),
				learnMoreUrl: 'https://jetpack.com/support/jetpack-billing-payments/',
			};
	}
};
