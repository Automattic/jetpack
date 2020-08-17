/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import analytics from '../../../_inc/client/lib/analytics';
import upgradeImageUrl from './upgrade-illustration.svg';
import { BUSINESS_PLAN } from '../../shared/components/upgrade-nudge/constants';
import useUpgradeFlow from '../../shared/use-upgrade-flow';
import getJetpackExtensionAvailability from '../../shared/get-jetpack-extension-availability';
import { name } from './index';

const trackViewEvent = () =>
	void analytics.tracks.recordEvent( 'jetpack_editor_block_upgrade_nudge_impression', {
		plan: BUSINESS_PLAN,
		block: name,
	} );

const trackClickEvent = () =>
	void analytics.tracks.recordEvent( 'jetpack_editor_block_upgrade_click', {
		plan: BUSINESS_PLAN,
		block: name,
	} );

export default function SocialPreviewsUpgrade() {
	const {
		details: { required_plan },
	} = getJetpackExtensionAvailability( name );
	const [ href, autosaveAndRedirect, isRedirecting ] = useUpgradeFlow(
		required_plan,
		trackClickEvent
	);

	// Using the effect here so the tracking is only called once on component mount.
	useEffect( trackViewEvent, [] );

	const redirectingText = __( 'Redirecting…', 'jetpack' );

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
				<Button
					href={ href } // Only for server-side rendering, since onClick doesn't work there.
					isPrimary
					label={ __( 'Purchase a business plan to access social previews', 'jetpack' ) }
					onClick={ autosaveAndRedirect }
					target="_top"
					isBusy={ isRedirecting }
				>
					{ isRedirecting ? redirectingText : __( 'Upgrade', 'jetpack' ) }
				</Button>
			</div>
		</div>
	);
}
