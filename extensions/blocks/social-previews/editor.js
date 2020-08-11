/**
 * Internal dependencies
 */
import { name, settings, SocialPreviews } from '.';
import registerJetpackPlugin from '../../shared/register-jetpack-plugin';
import { registerPlugin } from '@wordpress/plugins';
import getJetpackExtensionAvailability from '../../shared/get-jetpack-extension-availability';

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
// TODO: remove before submitting PR for a review.
const extensionAvailableOnPlan = false && getJetpackExtensionAvailability( 'social-previews' );

if ( ! extensionAvailableOnPlan ) {
	registerPlugin( `jetpack-${ name }-upgrade-nudge`, {
		render: () => {
			return <SocialPreviews showUpgradeNudge={ true } />;
		},
	} );
}
