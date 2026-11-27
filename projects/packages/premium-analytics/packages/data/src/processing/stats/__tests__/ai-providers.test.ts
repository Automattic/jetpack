/**
 * Internal dependencies
 */
import { sanitizeStatsAiProvidersResponse } from '../ai-providers';

describe( 'sanitizeStatsAiProvidersResponse', () => {
	it( 'groups the bots under their company and ranks both by requests', () => {
		const report = sanitizeStatsAiProvidersResponse( [
			{ bot_owner: 'Anthropic', bot_name: 'Claude-User', bot_type: 'AI Assistant', total: '5' },
			{ bot_owner: 'Anthropic', bot_name: 'ClaudeBot', bot_type: 'AI Crawler', total: '20' },
			{ bot_owner: 'OpenAI', bot_name: 'GPTBot', bot_type: 'AI Crawler', total: 40 },
			{ bot_owner: 'Unknown', bot_name: 'Unknown', bot_type: 'AI Crawler', total: '3' },
		] );

		expect( report.data ).toEqual( [
			{
				name: 'OpenAI',
				requests: 40,
				bots: [ { name: 'GPTBot', type: 'AI Crawler', requests: 40 } ],
			},
			{
				name: 'Anthropic',
				requests: 25,
				bots: [
					{ name: 'ClaudeBot', type: 'AI Crawler', requests: 20 },
					{ name: 'Claude-User', type: 'AI Assistant', requests: 5 },
				],
			},
			{
				name: 'Unknown',
				requests: 3,
				bots: [ { name: 'Unknown', type: 'AI Crawler', requests: 3 } ],
			},
		] );
	} );

	it( 'reads a response that is not a list as no companies', () => {
		expect( sanitizeStatsAiProvidersResponse( { error: 'ua_query_error' } ).data ).toEqual( [] );
	} );
} );
