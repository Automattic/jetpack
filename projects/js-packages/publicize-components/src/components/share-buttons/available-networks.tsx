import { __ } from '@wordpress/i18n';

type Network = {
	label: string;
	networkName: 'x' | 'whatsapp' | 'facebook' | 'linkedin' | 'tumblr' | 'pinterest' | 'mail';
	url: string;
};

export const availableNetworks: Array< Network > = [
	{
		label: __( 'X', 'jetpack' ),
		networkName: 'x',
		url: 'https://x.com/intent/tweet?text={{text}}&url={{url}}',
	},
	{
		label: __( 'WhatsApp', 'jetpack' ),
		networkName: 'whatsapp',
		url: 'https://api.whatsapp.com/send?text={{text}}',
	},
	{
		label: __( 'Facebook', 'jetpack' ),
		networkName: 'facebook',
		url: 'https://www.facebook.com/sharer/sharer.php?u={{url}}',
	},
	{
		label: __( 'Tumblr', 'jetpack' ),
		networkName: 'tumblr',
		url: 'https://www.tumblr.com/widgets/share/tool?canonicalUrl={{url}}&title={{text}}',
	},
	{
		label: __( 'LinkedIn', 'jetpack' ),
		networkName: 'linkedin',
		url: 'https://www.linkedin.com/shareArticle?mini=true&url={{url}}&title={{text}}',
	},
	{
		label: __( 'Pinterest', 'jetpack' ),
		networkName: 'pinterest',
		url: 'https://pinterest.com/pin/create/button/?url={{url}}&description={{text}}',
	},
	{
		label: __( 'Email', 'jetpack' ),
		networkName: 'mail',
		url: 'mailto:?subject={{text}}&body={{url}}',
	},
];
