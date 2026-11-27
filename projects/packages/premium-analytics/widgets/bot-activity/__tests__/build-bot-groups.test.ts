/**
 * Internal dependencies
 */
import { buildBotGroupRows } from '../build-bot-groups';

describe( 'buildBotGroupRows', () => {
	it( 'labels the template group keys, and names a group added later from its key', () => {
		const keys = [
			'ai_training',
			'ai_search',
			'ai_assistants_agents',
			'search_engines',
			'other_known',
			'unidentified',
			'ad_crawlers',
		];

		const rows = buildBotGroupRows(
			keys.map( key => ( { key, requests: 1, bots: [], botsHaveComparison: false } ) )
		);

		expect( rows.map( row => row.label ) ).toEqual( [
			'AI training',
			'AI search',
			'AI assistants & agents',
			'Search engines',
			'Other known bots',
			'Unidentified bots',
			'Ad crawlers',
		] );
	} );
} );
