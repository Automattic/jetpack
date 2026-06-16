/**
 * External dependencies
 */
import { Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { Syncing } from './components/syncing';
import './style.scss';

/**
 * Syncing route stage component.
 * Shows sync progress while data is being prepared.
 *
 * @return The syncing stage.
 */
export const stage = () => {
	return (
		<Stack align="center" justify="center" className="jetpack-premium-analytics-syncing-stage">
			<Syncing />
		</Stack>
	);
};
