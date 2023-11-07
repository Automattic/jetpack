/**
 * Types for the AI Assistant feature.
 */
import { UpgradeTypeProp } from './store/wordpress-com/types';

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
	'currnet-tier': {
		value: 1 | 20 | 100 | 200 | 500;
	};
	'tier-plans': Array< {
		slug: string;
		limit: number;
		value: 1 | 20 | 100 | 200 | 500;
	} >;
};
