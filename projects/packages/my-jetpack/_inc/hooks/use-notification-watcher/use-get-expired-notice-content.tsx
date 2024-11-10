import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

type RedBubbleAlerts = Window[ 'myJetpackInitialState' ][ 'redBubbleAlerts' ];

export const useGetExpiredNoticeContent = ( {
	product_slug,
	product_name,
}: RedBubbleAlerts[ `${ string }--plan_expired` ] ) => {
	if ( ! product_slug ) {
		return null;
	}
	// Remove the billing term suffix from the purchase product_slug. The notice will be the same regardless of the expired product's billing term.
	const productSlug = product_slug.replace( /(_yearly|_monthly)/, '' );

	switch ( productSlug ) {
		case 'jetpack_videopress':
			return {
				noticeTitle: sprintf(
					// translators: %s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc..
					__( 'Your %1$s plan has expired', 'jetpack-my-jetpack' ),
					product_name
				),
				noticeMessage: createInterpolateElement(
					__(
						'Your videos are no longer visible to your viewers, and you won’t be able to upload new content.<br/>' +
							'Don’t worry—you can resume your plan anytime to restore your video library and continue uploading.',
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
					__( 'Your %1$s plan has expired', 'jetpack-my-jetpack' ),
					product_name
				),
				noticeMessage: createInterpolateElement(
					sprintf(
						// translators: %1$s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc..
						__(
							'Your %1$s subcription has expired. Your paid features are no longer available.<br />' +
								'Don’t worry—you can resume your plan anytime to restore your access to paid features.',
							'jetpack-my-jetpack'
						),
						product_name
					),
					{
						br: <br />,
					}
				),
				learnMoreUrl: 'https://jetpack.com/support/jetpack-billing-payments/',
			};
	}
};
