import { SocialIconSlug } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';

type Network = {
	label: string;
	networkName: SocialIconSlug;
	url: string;
};

/**
 * Returns the list of available networks.
 *
 * @returns {Array<Network>} The list of available networks.
 */
export function useAvailableNetworks() {
	return useMemo< Array< Network > >(
		() => [
			{
				label: __( 'Twitter', 'jetpack' ),
				networkName: 'twitter',
				url: 'https://twitter.com/intent/tweet?text={{text}}&url={{url}}',
			},
			{
				label: __( 'WhatsApp', 'jetpack' ),
				networkName: 'whatsapp',
				url: 'https://api.whatsapp.com/send?text={{text}}',
			},
		],
		[]
	);
}
