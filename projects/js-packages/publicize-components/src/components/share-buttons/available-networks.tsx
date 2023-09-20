import { SocialIconSlug } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';

type Network = {
	label: string;
	networkName: SocialIconSlug;
	url: string;
};

export const availableNetworks: Array< Network > = [
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
];
