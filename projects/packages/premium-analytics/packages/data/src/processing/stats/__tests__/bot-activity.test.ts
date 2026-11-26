/**
 * Internal dependencies
 */
import { sanitizeStatsBotActivityResponse } from '../bot-activity';

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
