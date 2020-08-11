/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from '@wordpress/components';
import upgradeImageUrl from './upgrade-illustration.svg';

const SocialPreviewsUpgrade = function SocialPreviewsUpgrade() {
	return (
		<div className="jetpack-social-previews__modal-upgrade">
			<img
				className="jetpack-social-previews__upgrade-illustration"
				src={ upgradeImageUrl }
				width="351"
				height="264"
				alt="" // The image is decorative.
			/>
			<div className="jetpack-social-previews__upgrade-description">
				<h2 className="jetpack-social-previews__upgrade-heading">
					{ __( 'Upgrade to a Business Plan to unlock the power of our SEO tools', 'jetpack' ) }
				</h2>
				<ul className="jetpack-social-previews__upgrade-feature-list">
					<li>
						{ __(
							'Preview your site’s content as it will appear on Facebook, Twitter, and the WordPress.com Reader.',
							'jetpack'
						) }
					</li>
					<li>
						{ __(
							'Control how page titles will appear on Google search results and social networks.',
							'jetpack'
						) }
					</li>
					<li>
						{ __(
							'Customize your front page meta data to change how your site appears to search engines.',
							'jetpack'
						) }
					</li>
				</ul>
				<Button isPrimary>{ __( 'Upgrade', 'jetpack' ) }</Button>
			</div>
		</div>
	);
};

export default SocialPreviewsUpgrade;
