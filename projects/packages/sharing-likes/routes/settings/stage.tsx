import { dispatch } from '@wordpress/data';
import { store } from '../../src/settings-app/data/store';
import { getSharingLikesScriptData } from '../../src/settings-app/script-data';
import { SettingsScreen } from '../../src/settings-app/settings-screen';
import '../../src/settings-app/style.scss';

const scriptData = getSharingLikesScriptData();
if ( scriptData ) {
	dispatch( store ).seed( scriptData );
}

/**
 * wp-build stage for Settings > Sharing.
 *
 * @return The settings screen.
 */
const Stage = () => <SettingsScreen />;

export { Stage as stage };
