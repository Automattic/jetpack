import {
	isSimpleSite,
	getJetpackExtensionAvailability,
	registerJetpackPlugin,
} from '@automattic/jetpack-shared-extension-utils';
import { registerPlugin } from '@wordpress/plugins';
import { name, settings, SocialPreviews } from '.';

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
