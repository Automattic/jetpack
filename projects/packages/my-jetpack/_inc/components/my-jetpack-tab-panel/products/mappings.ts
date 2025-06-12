import { JetpackModuleSlug, JetpackProductWithCard, ProductCategory } from './types';

export const CATEGORY_CARDS_AND_MODULES: {
	[ key in ProductCategory ]: {
		cards: Array< JetpackProductWithCard >;
		modules: Array< JetpackModuleSlug >;
	};
} = {
	security: {
		cards: [ 'backup', 'scan', 'anti-spam' ],
		modules: [ 'waf', 'protect', 'account-protection', 'monitor' ],
	},
	growth: {
		cards: [ 'stats', 'social' ],
		modules: [ 'blaze', 'related-posts', 'subscriptions', 'sharedaddy', 'seo-tools', 'wordads' ],
	},
	performance: {
		cards: [ 'boost' ],
		modules: [ 'search', 'photon', 'videopress' ],
	},
	management: {
		cards: [ 'crm' ],
		modules: [],
	},
	create: {
		cards: [ 'ai' ],
		modules: [ 'carousel', 'post-by-email' ],
	},
	recommended: {
		cards: [ 'stats', 'social' ],
		modules: [
			'stats',
			'publicize',
			'blaze',
			'related-posts',
			'subscriptions',
			'sharedaddy',
			'seo-tools',
			'wordads',
		],
	},
};
