/**
 * Types for the AI Assistant feature.
 */
import type {
	TierProp,
	TierFreeProps,
	TierUnlimitedProps,
	UpgradeTypeProp,
	Tier100Props,
	Tier200Props,
	Tier500Props,
} from './store/wordpress-com/types';

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
	'current-tier': TierFreeProps | TierUnlimitedProps | Tier100Props | Tier200Props | Tier500Props;
	'tier-plans': Array< TierProp >;
	'next-tier'?:
		| TierFreeProps
		| TierUnlimitedProps
		| Tier100Props
		| Tier200Props
		| Tier500Props
		| null;
};
