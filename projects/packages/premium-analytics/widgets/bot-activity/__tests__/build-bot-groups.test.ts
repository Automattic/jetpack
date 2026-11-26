/**
 * Internal dependencies
 */
import { buildBotGroupRows } from '../build-bot-groups';

describe( 'buildBotGroupRows', () => {
	it( 'files each edge class under its group, with Generic Bot as unidentified', () => {
		const rows = buildBotGroupRows( [
			{ trafficClass: 'AI Data Scraper', botName: 'GPTBot', requests: 30 },
			{ trafficClass: 'AI Search Crawler', botName: 'OAI-SearchBot', requests: 20 },
			{ trafficClass: 'AI Agent', botName: 'ChatGPT-User', requests: 5 },
			{ trafficClass: 'Search Engine Crawler', botName: 'Googlebot', requests: 90 },
			{ trafficClass: 'Bot', botName: 'Generic Bot', requests: 40 },
			{ trafficClass: 'Bot', botName: 'AhrefsBot', requests: 3 },
			{ trafficClass: 'Software Library', botName: 'axios', requests: 60 },
		] );

		expect( rows.map( row => [ row.label, row.value ] ) ).toEqual( [
			[ 'Search engines', 90 ],
			[ 'Other known bots', 63 ],
			[ 'Unidentified bots', 40 ],
			[ 'AI training', 30 ],
			[ 'AI search', 20 ],
			[ 'AI assistants & agents', 5 ],
		] );
		expect( rows[ 1 ].children?.map( row => row.label ) ).toEqual( [ 'axios', 'AhrefsBot' ] );
	} );

	it( 'counts a bot the edge files under two classes of one group once', () => {
		const rows = buildBotGroupRows( [
			{ trafficClass: 'AI Assistant', botName: 'Perplexity-User', requests: 4 },
			{ trafficClass: 'AI Agent', botName: 'Perplexity-User', requests: 6 },
		] );

		expect( rows[ 0 ].children ).toEqual( [
			{ id: 'ai-assistants/Perplexity-User', label: 'Perplexity-User', value: 10 },
		] );
	} );
} );
