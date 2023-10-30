/**
 * Types for the AI Assistant feature.
 */
import { UpgradeTypeProp } from './blocks/ai-assistant/hooks/use-ai-feature';

/*
 * `sites/$site/ai-assistant-feature` endpoint response body props
 */
export type SiteAIAssistantFeatureEndpointResponseProps = {
	'has-feature': boolean;
	'is-over-limit': boolean;
	'requests-count': number;
	'requests-limit': number;
	'site-require-upgrade': boolean;
	'error-message': string;
	'error-code': string;
	'is-playground-visible': boolean;
	'upgrade-type': UpgradeTypeProp;
};
