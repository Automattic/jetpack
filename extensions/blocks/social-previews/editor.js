/**
 * WordPress dependencies
 */
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import { name, settings, SocialPreviews } from '.';
import getJetpackExtensionAvailability from '../../shared/get-jetpack-extension-availability';
import { isSimpleSite } from '../../shared/site-type-utils';
import registerJetpackPlugin from '../../shared/register-jetpack-plugin';

/*
 * Register the main "social-previews" extension if the feature is available
 * on the current plan.
 */
registerJetpackPlugin( name, settings );

/*
 * If the social previews extension is **not** available on this plan (WP.com only)
 * then manually register a near identical Plugin which shows the upgrade nudge.
 * Note this is necessary because the official `registerJetpackPlugin` checks the
 * extension availability so will not render the Plugin if the extension is not
 * availabile.
 */
const extensionAvailableOnPlan = getJetpackExtensionAvailability( 'social-previews' )?.available;

if ( ! extensionAvailableOnPlan && isSimpleSite() ) {
	registerPlugin( `jetpack-${ name }-upgrade-nudge`, {
		render: () => {
			return <SocialPreviews showUpgradeNudge={ true } />;
		},
	} );
}
