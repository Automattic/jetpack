import { SettingsPanel } from '../../_inc/components/settings-panel';
import Providers from '../../_inc/providers';

/**
 * Boot inspector for the My Jetpack dashboard: the settings panel `route.tsx` opens for `?configure=`.
 *
 * @return The panel, inside the stage's providers.
 */
const Inspector = () => (
	<Providers>
		<SettingsPanel />
	</Providers>
);

export { Inspector as inspector };
