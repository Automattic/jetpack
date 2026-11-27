import { __, _x } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { formatSiteAddress } from '../../helpers/format-site-address';
import styles from './styles.module.scss';
import type { IdentityCrisisAddressesProps } from './types';
import type { ReactNode } from 'react';

/**
 * The address WordPress.com has on record beside the address this site now loads at.
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

	const registeredLabel = isStore
		? /* translators: Label above the address WordPress.com has on record. */
			_x(
				'This store is registered with WordPress.com at',
				'WooCommerce store',
				'jetpack-connection-js'
			)
		: /* translators: Label above the address WordPress.com has on record. */
			__( 'This site is registered with WordPress.com at', 'jetpack-connection-js' );

	return (
		<dl className={ styles.addresses }>
			<div>
				<Text variant="body-sm" render={ <dt /> } className={ styles.hint }>
					{ registeredLabel }
				</Text>
				<Text variant="heading-lg" render={ <dd /> }>
					{ registered }
				</Text>
			</div>
			<div>
				<Text variant="body-sm" render={ <dt /> } className={ styles.hint }>
					{
						/* translators: Label above this site's current address, beside the one WordPress.com has on record. */
						__( 'It now loads at', 'jetpack-connection-js' )
					}
				</Text>
				<Text variant="heading-lg" render={ <dd /> }>
					{ current }
				</Text>
			</div>
		</dl>
	);
}
