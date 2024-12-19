import PlaceholderSiteIcon from '../../../placeholder-site-icon.svg';

export default {
	id: {
		type: 'string',
	},
	name: {
		type: 'string',
	},
	icon: {
		type: 'string',
		default: PlaceholderSiteIcon,
	},
	is_non_wpcom_site: {
		type: 'boolean',
		default: false,
	},
	url: {
		type: 'string',
	},
	description: {
		type: 'string',
	},
};
