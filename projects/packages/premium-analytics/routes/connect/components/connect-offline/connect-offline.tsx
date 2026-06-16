/**
 * External dependencies
 */
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { Connection } from '../../images';
import './style.scss';

/**
 * Shown on /connect when the site is in Jetpack offline/staging mode.
 *
 * In offline mode Jetpack forces `jetpack_connect` -> `do_not_allow`, so the
 * authorize button would always return a 403. We render an informative terminal
 * state instead. See README "Troubleshooting" for the underlying cause.
 *
 * @return The offline-mode screen.
 */
export function ConnectOffline() {
	return (
		<Stack
			direction="column"
			gap="xl"
			align="center"
			className="jetpack-premium-analytics-connect-offline"
		>
			<Connection />

			<Stack direction="column" gap="sm" align="center">
				<span className="jetpack-premium-analytics-connect-offline__title">
					{ __( 'Connection unavailable in offline mode', 'jetpack-premium-analytics' ) }
				</span>
				<span className="jetpack-premium-analytics-connect-offline__description">
					{ createInterpolateElement(
						__(
							"Jetpack is in offline/staging mode. Connection isn't available in this environment. To connect, use a host that isn't in offline mode. <doc>Learn about offline mode</doc>.",
							'jetpack-premium-analytics'
						),
						{
							doc: (
								<ExternalLink href="https://jetpack.com/support/offline-mode/">doc</ExternalLink>
							),
						}
					) }
				</span>
			</Stack>
		</Stack>
	);
}
