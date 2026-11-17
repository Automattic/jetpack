import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import { formatSiteAddress } from '../../helpers/format-site-address';
import styles from './styles.module.scss';
import type { IdentityCrisisMigratedProps } from './types';
import type { ReactNode } from 'react';

/**
 * What follows a successful Migrate request. The connection stays the same; WordPress.com updates
 * the address it has on record when the site next contacts it, so the wording must not say it has finished.
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
					/* translators: <from />: the address WordPress.com has on record. <to />: this site's address. */
					__(
						'Safe Mode is off for <to />. Stats, subscribers and the plan move over from <from /> the next time your site syncs with WordPress.com.',
						'jetpack-connection-js'
					),
					// Elements, not formatted text, so nothing in an address is parsed as a tag.
					{ from: <strong>{ from }</strong>, to: <strong>{ to }</strong> }
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
