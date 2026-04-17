import { REST_NAMESPACE } from '../constants';
import useSimpleMutation from './use-simple-mutation';
import useSimpleQuery from './use-simple-query';
import type {
	AiCrawlersResponse,
	LlmsTxtResponse,
	LlmsTxtUpdatePayload,
} from './discoverability-types';

export const useLlmsTxt = () =>
	useSimpleQuery< LlmsTxtResponse >( {
		name: 'jetpack-seo-llms-txt',
		query: { path: `/${ REST_NAMESPACE }/llms-txt` },
	} );

export const useUpdateLlmsTxt = () =>
	useSimpleMutation< LlmsTxtResponse, LlmsTxtUpdatePayload >( {
		name: 'jetpack-seo-llms-txt-update',
		query: { path: `/${ REST_NAMESPACE }/llms-txt`, method: 'POST' },
		invalidates: [ 'jetpack-seo-llms-txt', 'jetpack-seo-overview' ],
	} );

export const useAiCrawlers = () =>
	useSimpleQuery< AiCrawlersResponse >( {
		name: 'jetpack-seo-ai-crawlers',
		query: { path: `/${ REST_NAMESPACE }/ai-crawlers` },
	} );

export const useUpdateAiCrawlers = () =>
	useSimpleMutation< AiCrawlersResponse, { crawlers: Record< string, 'allow' | 'block' > } >( {
		name: 'jetpack-seo-ai-crawlers-update',
		query: { path: `/${ REST_NAMESPACE }/ai-crawlers`, method: 'POST' },
		invalidates: [ 'jetpack-seo-ai-crawlers', 'jetpack-seo-overview' ],
	} );
