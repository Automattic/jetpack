import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient, seedQueryClient } from '../../src/settings-app/data/queries';
import { getSharingLikesScriptData } from '../../src/settings-app/script-data';
import { SettingsScreen } from '../../src/settings-app/settings-screen';
import '../../src/settings-app/style.scss';

const queryClient = createQueryClient();

const scriptData = getSharingLikesScriptData();
if ( scriptData ) {
	seedQueryClient( queryClient, scriptData );
}

/**
 * wp-build stage for Settings > Sharing.
 *
 * @return The settings screen.
 */
const Stage = () => (
	<QueryClientProvider client={ queryClient }>
		<SettingsScreen />
	</QueryClientProvider>
);

export { Stage as stage };
