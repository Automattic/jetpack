/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { Connection } from '../../images';
import './style.scss';

/**
 * Screen shown on `/connect` when the site is not connected to WordPress.com.
 *
 * This package only detects the connection state and surfaces it — the actual
 * connection flow is owned by the consumer (e.g. the Premium Analytics plugin
 * or Jetpack), which uses the `@automattic/jetpack-connection` components. See
 * this route's README for the rationale.
 *
 * @return The site-not-connected screen.
 */
export function SiteNotConnected() {
	return (
		<Stack
			direction="column"
			gap="xl"
			align="center"
			className="jetpack-premium-analytics-site-not-connected"
		>
			<Connection />

			<Stack direction="column" gap="sm" align="center">
				<span className="jetpack-premium-analytics-site-not-connected__title">
					{ __( 'Connect your site', 'jetpack-premium-analytics' ) }
				</span>
				<span className="jetpack-premium-analytics-site-not-connected__description">
					{ __(
						"This site isn't connected to WordPress.com yet. Connect it to start syncing your store data and view your analytics.",
						'jetpack-premium-analytics'
					) }
				</span>
			</Stack>
		</Stack>
	);
}
