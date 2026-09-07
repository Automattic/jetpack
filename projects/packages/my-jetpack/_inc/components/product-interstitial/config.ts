import { JetpackProductWithCard } from '../../types';
import { getAntiSpamConfig } from './products/anti-spam.tsx';
import { getBackupConfig } from './products/backup';
import { getBoostConfig } from './products/boost';
import { getCrmConfig } from './products/crm.tsx';
import { getJetpackAiConfig } from './products/jetpack-ai';
import { getProtectConfig } from './products/protect';
import { getSearchConfig } from './products/search';
import { getSocialConfig } from './products/social';
import { getStatsConfig } from './products/stats.tsx';
import { getVideoPressConfig } from './products/videopress';
import { ProductConfig } from './types';

export type ProductConfigs = {
	[ productSlug in JetpackProductWithCard ]?: ProductConfig;
};

// Product configuration for pricing tables
export const getProductConfigs = (): ProductConfigs => ( {
	'anti-spam': getAntiSpamConfig(),
	backup: getBackupConfig(),
	boost: getBoostConfig(),
	crm: getCrmConfig(),
	protect: getProtectConfig(),
	social: getSocialConfig(),
	search: getSearchConfig(),
	stats: getStatsConfig(),
	videopress: getVideoPressConfig(),
	'jetpack-ai': getJetpackAiConfig(),
} );
