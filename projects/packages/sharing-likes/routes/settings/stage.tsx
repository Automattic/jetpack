import { SettingsScreen } from '../../src/settings-app/settings-screen';
import '../../src/settings-app/style.scss';

/**
 * wp-build stage for Settings > Sharing.
 *
 * @return The settings screen.
 */
const Stage = () => <SettingsScreen />;

export { Stage as stage };
