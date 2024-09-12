/**
 * Types for the AI Assistant feature.
 */
import type { TierProp, UpgradeTypeProp, FeaturesControl } from './store/wordpress-com/types';

/*
 * `sites/$site/ai-assistant-feature` endpoint response body props
 */
export type SiteAIAssistantFeatureEndpointResponseProps = {
	'is-enabled': boolean;
	'has-feature': boolean;
	'is-over-limit': boolean;
	'requests-count': number;
	'requests-limit': number;
	'usage-period': {
		'current-start': string;
		'next-start': string;
		'requests-count': number;
	};
	'site-require-upgrade': boolean;
	'error-message'?: string;
	'error-code'?: string;
	'upgrade-type': UpgradeTypeProp;
	'current-tier': TierProp;
	'tier-plans': Array< TierProp >;
	'next-tier'?: TierProp | null;
	costs?: {
		[ key: string ]: {
			[ key: string ]: number;
		};
	};
	'features-control'?: FeaturesControl;
};
