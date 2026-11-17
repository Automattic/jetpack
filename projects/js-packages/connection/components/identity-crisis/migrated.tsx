import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import { formatSiteAddress } from '../../helpers/format-site-address';
import styles from './styles.module.scss';
import type { IdentityCrisisMigratedProps } from './types';
import type { ReactNode } from 'react';

/**
 * What follows a successful Migrate request. Safe Mode is already off, but WordPress.com
 * moves the data on a later sync, so the wording does not claim the move has happened.
 *
 * @param {IdentityCrisisMigratedProps} props - Component props.
 * @return {ReactNode} The migrated state.
 */
export default function IdentityCrisisMigrated( {
	wpcomHomeUrl,
	currentUrl,
	onDone,
}: IdentityCrisisMigratedProps ): ReactNode {
	const from = formatSiteAddress( wpcomHomeUrl );
	const to = formatSiteAddress( currentUrl );

	return (
		<Stack direction="column" gap="md" align="flex-start" role="status">
			<Text variant="heading-xl" render={ <h2 /> }>
				{ sprintf(
					/* translators: %s: this site's address, e.g. example.com. */
					__( 'Moving the connection to %s', 'jetpack-connection-js' ),
					to
				) }
			</Text>
			<Text variant="body-lg" render={ <p /> } className={ styles.prose }>
				{ createInterpolateElement(
					sprintf(
						/* translators: %1$s: the address WordPress.com has on record. %2$s: this site's address. */
						__(
							'Safe Mode is off for <hostname>%2$s</hostname>. Stats, subscribers and the plan move over from <hostname>%1$s</hostname> the next time your site syncs with WordPress.com.',
							'jetpack-connection-js'
						),
						from,
						to
					),
					{ hostname: <strong /> }
				) }
			</Text>
			{ onDone && (
				<Button variant="solid" onClick={ onDone }>
					{ __( 'Got it', 'jetpack-connection-js' ) }
				</Button>
			) }
		</Stack>
	);
}
