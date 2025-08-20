import { JetpackProductWithCard } from '../../types';
import { getBackupConfig } from './products/backup';
import { getBoostConfig } from './products/boost';
import { getSearchConfig } from './products/search';
import { getSocialConfig } from './products/social';
import { ProductConfig } from './types';

export type ProductConfigs = {
	[ productSlug in JetpackProductWithCard ]?: ProductConfig;
};

// Product configuration for pricing tables
export const getProductConfigs = (): ProductConfigs => ( {
	backup: getBackupConfig(),
	boost: getBoostConfig(),
	social: getSocialConfig(),
	search: getSearchConfig(),
} );
