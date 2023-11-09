/**
 * Types for the AI Assistant feature.
 */
import type { TierSlugProp, TierValueProp, UpgradeTypeProp } from './store/wordpress-com/types';

/*
 * `sites/$site/ai-assistant-feature` endpoint response body props
 */
export type SiteAIAssistantFeatureEndpointResponseProps = {
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
	'is-playground-visible'?: boolean;
	'upgrade-type': UpgradeTypeProp;
	'current-tier': {
		value: TierValueProp;
	};
	'tier-plans': Array< {
		slug: TierSlugProp;
		limit: number;
		value: TierValueProp;
	} >;
	'next-tier'?: {
		slug: TierSlugProp;
		value: TierValueProp;
		limit: number;
		'redeable-limit': string;
	};
};
