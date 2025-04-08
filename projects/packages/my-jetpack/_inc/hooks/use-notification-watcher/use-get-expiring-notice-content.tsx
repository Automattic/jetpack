import { Col, Text } from '@automattic/jetpack-components';
import { gmdateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { ProductsList } from './products-list';

interface Props {
	productSlug: string;
	expiredAlertType: 'expired' | 'expiring-soon';
	productName: string;
	expiryDate: string;
	productsEffected: string[];
}

export const useGetExpiringNoticeContent = ( {
	productSlug,
	expiredAlertType,
	productName,
	expiryDate,
	productsEffected,
}: Props ) => {
	if ( ! productSlug ) {
		return null;
	}

	// Remove the billing term suffix from the purchase product_slug. The notice will be the same regardless of the expiring product's billing term.
	const product = productSlug.replace( /(?:_t1|_t2|_bi)?(?:_yearly|_monthly)/, '' );
	const expiryDateFormatted = gmdateI18n( 'M j, Y', expiryDate );

	const noticeHeading =
		expiredAlertType === 'expired'
			? sprintf(
					// translators: %s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc..
					__( 'Your %1$s plan has expired', 'jetpack-my-jetpack' ),
					productName
			  )
			: sprintf(
					// translators: %1$s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc..
					__( 'Heads up! Your %1$s plan is about to expire', 'jetpack-my-jetpack' ),
					productName
			  );

	// Notice Content
	switch ( product ) {
		case 'jetpack_videopress':
			return {
				noticeTitle: noticeHeading,
				noticeMessage:
					expiredAlertType === 'expired' ? (
						<>
							{ /* EXPIRED */ }
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
						</>
					) : (
						<>
							{ /* EXPIRING-SOON */ }
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
										expiryDateFormatted
									) }
								</Text>
							</Col>
						</>
					),
				learnMoreUrl:
					'https://jetpack.com/support/jetpack-videopress/#canceled-or-expired-videopress-plan',
			};
		case 'jetpack_complete':
		case 'jetpack_security':
		case 'jetpack_growth':
			return {
				noticeTitle: noticeHeading,
				noticeMessage:
					expiredAlertType === 'expired' ? (
						<>
							{ /* EXPIRED */ }
							<Col>
								<Text mt={ 2 }>
									{ sprintf(
										// translators: %1$s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc..
										__(
											'%1$s provides paid features for the following products:',
											'jetpack-my-jetpack'
										),
										productName
									) }
								</Text>

								<ProductsList products={ productsEffected } />

								<Text mb={ 2 }>
									{ sprintf(
										// translators: %1$s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc..
										__(
											'Since your %1$s plan is expired, the paid features for these products are no longer available for your site.',
											'jetpack-my-jetpack'
										),
										productName
									) }
								</Text>
								<Text mb={ 2 }>
									{ __(
										'But don’t worry—you can resume your plan to restore your access to your plan’s paid features.',
										'jetpack-my-jetpack'
									) }
								</Text>
							</Col>
						</>
					) : (
						<>
							{ /* EXPIRING-SOON */ }
							<Col>
								<Text mt={ 2 }>
									{ sprintf(
										// translators: %1$s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc..
										__(
											'%1$s provides paid features for the following products:',
											'jetpack-my-jetpack'
										),
										productName
									) }
								</Text>

								<ProductsList products={ productsEffected } />

								<Text mb={ 2 }>
									{ sprintf(
										// translators: %1$s is the product's expiration date, i.e.- "Nov 11, 2024"
										__(
											'Renew your plan by %1$s to continue to have access to the paid features of these products.',
											'jetpack-my-jetpack'
										),
										expiryDateFormatted
									) }
								</Text>
							</Col>
						</>
					),
				learnMoreUrl: 'https://jetpack.com/support/jetpack-billing-payments/',
			};
		default:
			return {
				noticeTitle: noticeHeading,
				noticeMessage:
					expiredAlertType === 'expired' ? (
						<>
							{ /* EXPIRED */ }
							<Col>
								<Text mt={ 2 } mb={ 2 }>
									{ sprintf(
										// translators: %1$s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc..
										__(
											'Your %1$s subcription has expired. The paid features are no longer available.',
											'jetpack-my-jetpack'
										),
										productName
									) }
								</Text>
								<Text mb={ 2 }>
									{ __(
										'Don’t worry—you can resume your plan anytime to restore your access to the upgraded features.',
										'jetpack-my-jetpack'
									) }
								</Text>
							</Col>
						</>
					) : (
						<>
							{ /* EXPIRING-SOON */ }
							<Col>
								<Text mt={ 2 } mb={ 2 }>
									{ sprintf(
										// translators: %1$s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Security, etc.., %2$s is the product's expiration date, i.e.- "Nov 11, 2024".
										__(
											'Your %1$s subcription will be expiring soon on %2$s, and the paid features for this product will no longer be available.',
											'jetpack-my-jetpack'
										),
										productName,
										expiryDateFormatted
									) }
								</Text>
								<Text mb={ 2 }>
									{ __(
										'To keep everything running smoothly, renew your plan today!',
										'jetpack-my-jetpack'
									) }
								</Text>
							</Col>
						</>
					),
				learnMoreUrl: 'https://jetpack.com/support/jetpack-billing-payments/',
			};
	}
};
