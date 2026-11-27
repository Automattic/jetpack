import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { localizeUrl } from '../../../../compat/utils';

/**
 *
 */
export default function IneligibleSite() {
	return (
		<div className="promote-post-i2__aux-wrapper">
			<div className="empty-promotion-list__container promote-post-i2__setup-container">
				<div className="promote-post-i2__inner-container">
					<div className="promote-post-i2__setup-icon"></div>
					<h3 className="setup-pages__title wp-brand-font">
						{ sprintf(
							/* translators: %(productName)s is the product name, Blaze Ads. */ __(
								'Your site is not eligible to Advertise with %(productName)s',
								'jetpack-blaze'
							),
							{ productName: 'Blaze Ads' }
						) }
					</h3>
					<p className="setup-pages__body">
						{ createInterpolateElement(
							sprintf(
								/* translators: %(productName)s is the product name, Blaze Ads. */ __(
									"Unfortunately, your site doesn't qualify for advertising using %(productName)s. If you have any questions or need assistance, please contact our <a>support team</a>.",
									'jetpack-blaze'
								),
								{ productName: 'Blaze Ads' }
							),
							{
								a: (
									<Link href={ localizeUrl( 'https://wordpress.com/help/contact' ) } openInNewTab />
								),
							}
						) }
					</p>
				</div>
			</div>
		</div>
	);
}
