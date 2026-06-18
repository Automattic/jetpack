/**
 * External dependencies
 */
import { Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { SiteNotConnected } from './components/site-not-connected';
import './style.scss';

/**
 * Connect route stage component.
 *
 * Reached only when the site is not connected — the route guard in `route.tsx`
 * redirects to the dashboard once the site is registered. The actual connection
 * flow is owned by the consumer, so this just surfaces the not-connected state.
 *
 * @return The connect stage.
 */
export const stage = () => {
	return (
		<Stack align="center" justify="center" className="jetpack-premium-analytics-connect-stage">
			<SiteNotConnected />
		</Stack>
	);
};
