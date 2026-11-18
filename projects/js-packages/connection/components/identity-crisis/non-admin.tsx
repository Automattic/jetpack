import { __, _x } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import styles from './styles.module.scss';
import SupportLink from './support-link';
import type { IdentityCrisisNonAdminProps } from './types';
import type { ReactNode } from 'react';

/**
 * Safe Mode for a user who cannot resolve it.
 *
 * @param {IdentityCrisisNonAdminProps} props - Component props.
 * @return {ReactNode} The view.
 */
export default function IdentityCrisisNonAdmin( {
	isStore = false,
	onDismiss,
}: IdentityCrisisNonAdminProps ): ReactNode {
	return (
		<Stack direction="column" gap="md" align="flex-start">
			<Text variant="body-md" render={ <p /> } className={ styles.prose }>
				{ isStore
					? _x(
							'Features that sync with WordPress.com are paused because this store is registered with WordPress.com at a different address. Payments will not be interrupted. An administrator needs to resolve this.',
							'WooCommerce store',
							'jetpack-connection-js'
						)
					: __(
							'Features that sync with WordPress.com are paused because this site is registered with WordPress.com at a different address. An administrator needs to resolve this.',
							'jetpack-connection-js'
						) }
			</Text>
			<Stack direction="row" gap="md" align="center" wrap="wrap">
				{ onDismiss && (
					<Button variant="outline" onClick={ onDismiss }>
						{ __( 'Dismiss', 'jetpack-connection-js' ) }
					</Button>
				) }
				<SupportLink>{ __( 'Learn more about Safe Mode', 'jetpack-connection-js' ) }</SupportLink>
			</Stack>
		</Stack>
	);
}
