/**
 * Internal dependencies
 */
import {
	mergeStatsBotActivityComparisonRows,
	sanitizeStatsBotActivityResponse,
} from '../bot-activity';

describe( 'sanitizeStatsBotActivityResponse', () => {
	it( 'nests the bots under their group and takes the group total from the whole group', () => {
		// `bots_per_group` cut the search engines to two bots; the group has more requests than they sum to.
		const report = sanitizeStatsBotActivityResponse( [
			{ bot_group: 'ai_training', group_order: 1, bot_name: 'GPTBot', total: 40, group_total: 40 },
			{
				bot_group: 'search_engines',
				group_order: 4,
				bot_name: 'Googlebot',
				total: '900',
				group_total: '1200',
			},
			{
				bot_group: 'search_engines',
				group_order: 4,
				bot_name: 'bingbot',
				total: '200',
				group_total: '1200',
			},
		] );

		expect( report.data ).toEqual( [
			{ key: 'ai_training', requests: 40, bots: [ { name: 'GPTBot', requests: 40 } ] },
			{
				key: 'search_engines',
				requests: 1200,
				bots: [
					{ name: 'Googlebot', requests: 900 },
					{ name: 'bingbot', requests: 200 },
				],
			},
		] );
	} );
} );

describe( 'mergeStatsBotActivityComparisonRows', () => {
	it( 'pairs groups by key and bots by name, leaving out what the comparison period lacks', () => {
		const merged = mergeStatsBotActivityComparisonRows(
			{
				data: [
					{
						key: 'ai_training',
						requests: 50,
						bots: [
							{ name: 'GPTBot', requests: 40 },
							{ name: 'ClaudeBot', requests: 10 },
						],
					},
					{ key: 'ai_search', requests: 7, bots: [ { name: 'Applebot', requests: 7 } ] },
				],
			},
			{
				data: [
					{ key: 'ai_training', requests: 30, bots: [ { name: 'GPTBot', requests: 30 } ] },
					{ key: 'search_engines', requests: 90, bots: [ { name: 'Googlebot', requests: 90 } ] },
				],
			}
		);

		expect( merged.hasComparison ).toBe( true );
		expect( merged.rows ).toEqual( [
			{
				key: 'ai_training',
				requests: 50,
				previousValue: 30,
				botsHaveComparison: true,
				bots: [
					{ name: 'GPTBot', requests: 40, previousValue: 30 },
					{ name: 'ClaudeBot', requests: 10, previousValue: undefined },
				],
			},
			{
				key: 'ai_search',
				requests: 7,
				previousValue: undefined,
				botsHaveComparison: false,
				bots: [ { name: 'Applebot', requests: 7, previousValue: undefined } ],
			},
		] );
	} );
} );
