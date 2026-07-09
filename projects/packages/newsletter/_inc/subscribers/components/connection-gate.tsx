import { __ } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import './connection-gate.scss';

type Props = {
	/** Starts the site-registration + user-connection flow. */
	onConnect: () => void;
	/** True while registration or user connection is in flight. */
	isConnecting: boolean;
};

/**
 * Connect prompt shown in place of the Subscribers data view when the site or
 * the current user isn't connected to WordPress.com. Subscriber management
 * proxies to WP.com signed as the current user, so without a user token every
 * request fails with `missing_token`; this prompt is the gate's fallback,
 * decided in `routes/dashboard/stage.tsx`. Renders inside the existing
 * `AdminPage` chrome, so it intentionally does not mount its own `AdminPage`.
 *
 * @param props              - Component props.
 * @param props.onConnect    - Starts the connection flow.
 * @param props.isConnecting - Whether the connection flow is in progress.
 * @return The connect prompt element.
 */
export default function ConnectionGate( { onConnect, isConnecting }: Props ) {
	return (
		<Stack direction="column" gap="md" className="jetpack-newsletter-connection-gate">
			<Text variant="heading-2xl">
				{ __( 'Connect to manage your subscribers', 'jetpack-newsletter' ) }
			</Text>
			<Text>
				{ __(
					'Subscriber management needs a connection to WordPress.com before you can view and manage everyone subscribed to your site.',
					'jetpack-newsletter'
				) }
			</Text>
			<div>
				<Button variant="solid" disabled={ isConnecting } onClick={ onConnect }>
					{ isConnecting
						? __( 'Connecting…', 'jetpack-newsletter' )
						: __( 'Connect', 'jetpack-newsletter' ) }
				</Button>
			</div>
		</Stack>
	);
}
