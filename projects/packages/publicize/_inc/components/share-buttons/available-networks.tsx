import { __ } from '@wordpress/i18n';

type Network = {
	label: string;
	networkName: 'x' | 'whatsapp' | 'facebook';
	url: string;
};

export const availableNetworks: Array< Network > = [
	{
		label: __( 'X', 'jetpack-publicize-pkg' ),
		networkName: 'x',
		url: 'https://x.com/intent/tweet?text={{text}}&url={{url}}',
	},
	{
		label: __( 'WhatsApp', 'jetpack-publicize-pkg' ),
		networkName: 'whatsapp',
		url: 'https://api.whatsapp.com/send?text={{text}}',
	},
	{
		label: __( 'Facebook', 'jetpack-publicize-pkg' ),
		networkName: 'facebook',
		url: 'https://www.facebook.com/sharer/sharer.php?u={{url}}',
	},
];
