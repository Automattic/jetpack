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
		cards: [ 'backup', 'protect', 'anti-spam' ],
		modules: [
			// No prettier please
			'account-protection',
			'monitor',
			'notes',
			'sso',
			'verification-tools',
			'waf',
		],
	},
	growth: {
		cards: [ 'stats', 'social', 'jetpack-ai', 'crm' ],
		modules: [
			'blaze',
			'comment-likes',
			'comments',
			'contact-form',
			'copy-post',
			'likes',
			'related-posts',
			'seo-tools',
			'sharedaddy',
			'sitemaps',
			'subscriptions',
			'woocommerce-analytics',
			'wordads',
		],
	},
	performance: {
		cards: [ 'boost', 'search', 'videopress' ],
		modules: [ 'photon', 'photon-cdn' ],
	},
	recommended: {
		cards: [ 'stats', 'boost', 'backup', 'anti-spam' ],
		modules: [
			// No prettier please
			'videopress',
			'contact-form',
			'publicize',
			'search',
		],
	},
	other: {
		cards: [],
		modules: [
			'blocks',
			'carousel',
			'google-fonts',
			'gravatar-hovercards',
			'infinite-scroll',
			'json-api',
			'latex',
			'markdown',
			'post-by-email',
			'post-list',
			'shortcodes',
			'shortlinks',
			'tiled-gallery',
			'widget-visibility',
			'widgets',
		],
	},
};

export const PRODUCT_ICONS: {
	[ Key in JetpackProductWithCard ]: React.ComponentType;
} = {
	'anti-spam': AntiSpamIcon,
	backup: BackupIcon,
	boost: BoostIcon,
	'jetpack-ai': JetpackAiIcon,
	crm: CrmIcon,
	protect: ProtectIcon,
	search: SearchIcon,
	social: SocialIcon,
	stats: StatsIcon,
	videopress: VideopressIcon,
};

/**
 * Maps Jetpack products with cards that have different slugs to their corresponding modules
 */
export const PRODUCT_MODULES: {
	[ Key in JetpackProductWithCard ]?: JetpackModuleSlug;
} = {
	backup: 'vaultpress',
	social: 'publicize',
};
