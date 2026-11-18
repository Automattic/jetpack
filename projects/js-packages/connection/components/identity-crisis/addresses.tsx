import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
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

	const sentence = isStore
		? /* translators: <registered />: the address WordPress.com has on record. <current />: the address this store now loads at. */
			_x(
				'This store is registered with WordPress.com at <registered />, but now loads at <current />.',
				'WooCommerce store',
				'jetpack-connection-js'
			)
		: /* translators: <registered />: the address WordPress.com has on record. <current />: the address this site now loads at. */
			__(
				'This site is registered with WordPress.com at <registered />, but now loads at <current />.',
				'jetpack-connection-js'
			);

	return (
		<div className={ styles.addresses }>
			<Text variant="body-sm">
				{ createInterpolateElement( sentence, {
					registered: <strong>{ registered }</strong>,
					current: <strong>{ current }</strong>,
				} ) }
			</Text>
		</div>
	);
}
