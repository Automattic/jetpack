import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import analytics from '../../../_inc/client/lib/analytics';
import useUpgradeFlow from '../../shared/use-upgrade-flow';
import upgradeImageUrl from './upgrade-illustration.svg';
import { name as block } from './index';

export default function SocialPreviewsUpgrade() {
	const plan = getJetpackExtensionAvailability( block )?.details?.required_plan;
	const trackClickEvent = () =>
		void analytics.tracks.recordEvent( 'jetpack_editor_block_upgrade_click', { plan, block } );

	const [ href, autosaveAndRedirect, isRedirecting ] = useUpgradeFlow( plan, trackClickEvent );

	const buttonText = isRedirecting
		? __( 'Redirecting…', 'jetpack' )
		: __( 'Upgrade', 'jetpack', /* dummy arg to avoid bad minification */ 0 );

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
					{ __( 'Upgrade to a Pro plan to unlock the power of our SEO tools', 'jetpack' ) }
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
							'Customize your front page metadata to change how your site appears to search engines.',
							'jetpack'
						) }
					</li>
				</ul>
				<Button
					href={ href } // Only for server-side rendering, since onClick doesn't work there.
					variant="primary"
					label={ __( 'Purchase a Business plan to access social previews', 'jetpack' ) }
					onClick={ autosaveAndRedirect }
					target="_top"
					isBusy={ isRedirecting }
				>
					{ buttonText }
				</Button>
			</div>
		</div>
	);
}
