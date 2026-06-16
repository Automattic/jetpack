/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { ConnectionError } from '../../images';
import './style.scss';

/**
 * Fallback shown when Jetpack connection data is unavailable.
 *
 * @return The connection-unavailable screen.
 */
export function ConnectUnavailable() {
	return (
		<Stack
			direction="column"
			gap="xl"
			align="center"
			className="jetpack-premium-analytics-connect-unavailable"
		>
			<ConnectionError />

			<Stack direction="column" gap="sm" align="center">
				<span className="jetpack-premium-analytics-connect-unavailable__title">
					{ __( 'Connection unavailable', 'jetpack-premium-analytics' ) }
				</span>
				<span className="jetpack-premium-analytics-connect-unavailable__description">
					{ __(
						'Jetpack connection data is unavailable. Make sure the Jetpack plugin is installed and active.',
						'jetpack-premium-analytics'
					) }
				</span>
			</Stack>
		</Stack>
	);
}
