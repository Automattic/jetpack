import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Notice, Stack, Text } from '@wordpress/ui';
import { useId } from 'react';
import { formatSiteAddress } from '../../helpers/format-site-address';
import styles from './styles.module.scss';
import type { IdentityCrisisMigratedProps } from './types';
import type { ReactNode } from 'react';

/**
 * What follows a successful Migrate request. WordPress.com updates its address when the site
 * next syncs, so the wording must not say it has finished.
 *
 * @param {IdentityCrisisMigratedProps} props - Component props.
 * @return {ReactNode} The migrated state.
 */
export default function IdentityCrisisMigrated( {
	wpcomHomeUrl,
	currentUrl,
	onDone,
}: IdentityCrisisMigratedProps ): ReactNode {
	const noticeId = useId();
	// Elements, not formatted text, so nothing in an address is parsed as a tag.
	const addresses = {
		x: <strong>{ formatSiteAddress( currentUrl ) }</strong>,
		z: <strong>{ formatSiteAddress( wpcomHomeUrl ) }</strong>,
	};

	return (
		<Stack direction="column" gap="md">
			<Notice.Root id={ noticeId } intent="success" role="status" className={ styles.prose }>
				<Notice.Title render={ <h3 /> }>
					{ __( 'Address update started', 'jetpack-connection-js' ) }
				</Notice.Title>
				<Notice.Description render={ <p /> }>
					{ createInterpolateElement(
						/* translators: <x />: this site's address, e.g. example.com. */
						__(
							'WordPress.com is updating the address it has on file to <x />. This usually takes a few minutes.',
							'jetpack-connection-js'
						),
						addresses
					) }
				</Notice.Description>
			</Notice.Root>
			<Text variant="body-md" render={ <p /> } className={ styles.prose }>
				{ createInterpolateElement(
					/* translators: <z />: the address WordPress.com had on record, e.g. example.com. */
					__(
						'If <z /> is still running, it will stop syncing and ask this same question. If this screen is back tomorrow, the update did not finish. Contact support and we will complete it.',
						'jetpack-connection-js'
					),
					addresses
				) }
			</Text>
			{ onDone && (
				<div>
					{ /* The screen focuses this button, so it carries the message the status may not announce. */ }
					<Button variant="solid" onClick={ onDone } aria-describedby={ noticeId }>
						{ __( 'Got it, thanks', 'jetpack-connection-js' ) }
					</Button>
				</div>
			) }
		</Stack>
	);
}
