export interface LlmsTxtConfig {
	include_types: string[];
	max_items: number;
	override: string;
}

export interface LlmsTxtResponse {
	enabled: boolean;
	config: LlmsTxtConfig;
	preview: string;
}

export interface LlmsTxtUpdatePayload {
	enabled?: boolean;
	include_types?: string[];
	max_items?: number;
	override?: string;
}

export interface AiCrawlersResponse {
	known: string[];
	crawlers: Record< string, 'allow' | 'block' >;
}
