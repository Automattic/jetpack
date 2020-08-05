/**
 * Internal dependencies
 */
import { name, settings, SocialPreviews } from '.';
import registerJetpackPlugin from '../../shared/register-jetpack-plugin';
import { registerPlugin } from '@wordpress/plugins';

registerJetpackPlugin( name, settings );

// const blockAvailableOnPlan = Jetpack_Editor_Initial_State.available_blocks[ 'social-previews' ].available;
const blockAvailableOnPlan = false;

registerPlugin( `jetpack-${name}-upgrade-nudge`, {
    render: () => {
        if ( blockAvailableOnPlan ) {
            return null;
        }

        return (
            <SocialPreviews showUpgradeNudge={ true } />
        );
    }

} );
