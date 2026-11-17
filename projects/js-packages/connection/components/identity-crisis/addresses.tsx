import { __, sprintf } from '@wordpress/i18n';
import { Icon, arrowDown, lineSolid } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import { formatSiteAddress } from '../../helpers/format-site-address';
import styles from './styles.module.scss';
import type { IdentityCrisisAddressesProps } from './types';
import type { ReactNode } from 'react';

/**
 * The address WordPress.com has on record and this site's, joined by what an action does to them.
 *
 * @param {IdentityCrisisAddressesProps} props - Component props.
 * @return {ReactNode} The diagram, or null without both addresses.
 */
export default function IdentityCrisisAddresses( {
	wpcomHomeUrl,
	currentUrl,
	variant,
}: IdentityCrisisAddressesProps ): ReactNode {
	const from = formatSiteAddress( wpcomHomeUrl );
	const to = formatSiteAddress( currentUrl );
	if ( ! from || ! to ) {
		return null;
	}

	const label =
		variant === 'move'
			? sprintf(
					/* translators: %1$s: the address WordPress.com has on record. %2$s: this site's address. */
					__( 'From %1$s to %2$s', 'jetpack-connection-js' ),
					from,
					to
				)
			: sprintf(
					/* translators: %1$s: the address WordPress.com has on record. %2$s: this site's address. */
					__( '%1$s and %2$s, connected separately', 'jetpack-connection-js' ),
					from,
					to
				);

	return (
		<Stack direction="column" align="center" gap="xs" role="img" aria-label={ label }>
			<span className={ styles.address }>{ from }</span>
			<Icon icon={ variant === 'move' ? arrowDown : lineSolid } size={ 24 } />
			<span className={ styles.address }>{ to }</span>
		</Stack>
	);
}
