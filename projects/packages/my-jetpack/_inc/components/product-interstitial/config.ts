import { JetpackProductWithCard } from '../../types';
import { getAntiSpamConfig } from './products/anti-spam.tsx';
import { getBackupConfig } from './products/backup';
import { getBoostConfig } from './products/boost';
import { getJetpackAiConfig } from './products/jetpack-ai';
import { getProtectConfig } from './products/protect';
import { getSearchConfig } from './products/search';
import { getSocialConfig } from './products/social';
import { ProductConfig } from './types';

export type ProductConfigs = {
	[ productSlug in JetpackProductWithCard ]?: ProductConfig;
};

// Product configuration for pricing tables
export const getProductConfigs = (): ProductConfigs => ( {
	'anti-spam': getAntiSpamConfig(),
	backup: getBackupConfig(),
	boost: getBoostConfig(),
	protect: getProtectConfig(),
	social: getSocialConfig(),
	search: getSearchConfig(),
	'jetpack-ai': getJetpackAiConfig(),
} );
