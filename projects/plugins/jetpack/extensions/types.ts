/**
 * Types for the AI Assistant feature.
 */
import type { TierValueProp, UpgradeTypeProp } from './store/wordpress-com/types';

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
		slug: string;
		limit: number;
		value: TierValueProp;
	} >;
};
