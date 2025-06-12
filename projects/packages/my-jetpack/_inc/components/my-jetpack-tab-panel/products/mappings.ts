import {
	BackupCard,
	AiCard,
	AntiSpamCard,
	BoostCard,
	CrmCard,
	ScanCard,
	SearchCard,
	SocialCard,
	StatsCard,
	VideopressCard,
} from './cards';
import { JetpackModuleSlug, JetpackProductWithCard, ProductCategory } from './types';

/**
 * Mapping of Jetpack modules to their respective product cards.
 */
export const PRODUCT_CARDS = {
	ai: AiCard,
	'jetpack-ai': AiCard,
	'anti-spam': AntiSpamCard,
	backup: BackupCard,
	boost: BoostCard,
	crm: CrmCard,
	scan: ScanCard,
	search: SearchCard,
	social: SocialCard,
	stats: StatsCard,
	videopress: VideopressCard,
} satisfies {
	[ key in JetpackProductWithCard ]?: React.ComponentType;
};

export const CATEGORY_CARDS_AND_MODULES: {
	[ key in ProductCategory ]: {
		cards: Array< keyof typeof PRODUCT_CARDS >;
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
