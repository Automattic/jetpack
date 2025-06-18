import AntiSpamIcon from '../../products-table-view/icons/anti-spam';
import BackupIcon from '../../products-table-view/icons/backup';
import BoostIcon from '../../products-table-view/icons/boost';
import CrmIcon from '../../products-table-view/icons/crm';
import JetpackAiIcon from '../../products-table-view/icons/jetpack-ai';
import ProtectIcon from '../../products-table-view/icons/protect';
import SearchIcon from '../../products-table-view/icons/search';
import SocialIcon from '../../products-table-view/icons/social';
import StatsIcon from '../../products-table-view/icons/stats';
import VideopressIcon from '../../products-table-view/icons/videopress';
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

export const PRODUCT_ICONS: {
	[ Key in JetpackProductWithCard ]: React.ComponentType;
} = {
	ai: JetpackAiIcon,
	'anti-spam': AntiSpamIcon,
	backup: BackupIcon,
	boost: BoostIcon,
	'jetpack-ai': JetpackAiIcon,
	crm: CrmIcon,
	scan: ProtectIcon,
	search: SearchIcon,
	social: SocialIcon,
	stats: StatsIcon,
	videopress: VideopressIcon,
};

/**
 * Maps Jetpack products with cards to their corresponding modules
 */
export const PRODUCT_MODULES: {
	[ Key in JetpackProductWithCard ]?: JetpackModuleSlug;
} = {
	// TODO Verify these mappings
	backup: 'vaultpress',
	scan: 'protect',
	social: 'publicize',
};
