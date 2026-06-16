/**
 * External dependencies
 */
import { Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ConnectionError } from '../../images';
import './style.scss';

export function ConnectUnavailable() {
	return (
		<Stack
			direction="column"
			gap="xl"
			align="center"
			className="wc-analytics-connect-unavailable"
		>
			<ConnectionError />

			<Stack direction="column" gap="sm" align="center">
				<span className="wc-analytics-connect-unavailable__title">
					{ __( 'Connection unavailable', 'woocommerce-analytics' ) }
				</span>
				<span className="wc-analytics-connect-unavailable__description">
					{ __(
						'Jetpack connection data is unavailable. Make sure the Jetpack plugin is installed and active.',
						'woocommerce-analytics'
					) }
				</span>
			</Stack>
		</Stack>
	);
}
