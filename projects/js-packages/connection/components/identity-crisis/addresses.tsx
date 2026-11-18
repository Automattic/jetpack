import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { formatSiteAddress } from '../../helpers/format-site-address';
import styles from './styles.module.scss';
import type { IdentityCrisisAddressesProps } from './types';
import type { ReactNode } from 'react';

/**
 * The address WordPress.com has on record over the address this site now loads at.
 *
 * @param {IdentityCrisisAddressesProps} props - Component props.
 * @return {ReactNode} The panel, or null without both addresses.
 */
export default function IdentityCrisisAddresses( {
	wpcomHomeUrl,
	currentUrl,
	isStore = false,
}: IdentityCrisisAddressesProps ): ReactNode {
	const registered = formatSiteAddress( wpcomHomeUrl );
	const current = formatSiteAddress( currentUrl );
	if ( ! registered || ! current ) {
		return null;
	}

	return (
		<Stack direction="column" gap="sm" className={ styles.addresses }>
			<Stack direction="column" gap="xs">
				<Text variant="body-sm">
					{ isStore
						? __( 'This store is registered with WordPress.com at', 'jetpack-connection-js' )
						: __( 'This site is registered with WordPress.com at', 'jetpack-connection-js' ) }
				</Text>
				<span className={ styles.address }>{ registered }</span>
			</Stack>
			<Stack direction="column" gap="xs">
				<Text variant="body-sm">{ __( 'but now loads at', 'jetpack-connection-js' ) }</Text>
				<span className={ styles.address }>{ current }</span>
			</Stack>
		</Stack>
	);
}
