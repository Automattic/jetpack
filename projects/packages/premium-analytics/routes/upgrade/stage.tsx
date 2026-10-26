/**
 * External dependencies
 */
import { AnalyticsQueryClientProvider } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { UpgradePage } from './components/upgrade-page';

/**
 * Upgrade route stage: the Stats tier purchase page.
 *
 * @return The upgrade stage.
 */
export const stage = () => (
	<AnalyticsQueryClientProvider>
		<UpgradePage />
	</AnalyticsQueryClientProvider>
);
