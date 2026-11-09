import { __ } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import useWpcomConnection from '../data/use-wpcom-connection';
import type { ReactNode } from 'react';

/**
 * Renders its children only when the page can call WordPress.com as the current user, and a connect prompt otherwise.
 *
 * @param props          - Component props.
 * @param props.children - What needs WordPress.com.
 * @return The children, or the connect prompt.
 */
export default function ConnectionGate( { children }: { children: ReactNode } ) {
	const { canUseWpcom, connect, isConnecting } = useWpcomConnection();

	if ( canUseWpcom ) {
		return <>{ children }</>;
	}

	return (
		<Stack direction="column" gap="md" className="jp-monetize-connection-gate">
			<Text variant="heading-2xl">{ __( 'Connect to start earning', 'jetpack-monetize' ) }</Text>
			<Text>
				{ __(
					'Payments, paid subscribers and ads are managed on WordPress.com. Connect your WordPress.com account to use them here.',
					'jetpack-monetize'
				) }
			</Text>
			<div>
				<Button variant="solid" disabled={ isConnecting } onClick={ connect }>
					{ isConnecting
						? __( 'Connecting…', 'jetpack-monetize' )
						: __( 'Connect', 'jetpack-monetize' ) }
				</Button>
			</div>
		</Stack>
	);
}
