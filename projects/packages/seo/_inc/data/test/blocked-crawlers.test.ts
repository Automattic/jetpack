import { isCrawlerBlocked, withCrawlerBlocked, withGroupBlocked } from '../blocked-crawlers';
import type { AiCrawler, BlockedCrawlers } from '../geo-types';

const catalog: AiCrawler[] = [
	{
		slug: 'oai-searchbot',
		label: 'OAI-SearchBot',
		userAgents: [ 'OAI-SearchBot' ],
		type: 'answer',
	},
	{ slug: 'gptbot', label: 'GPTBot', userAgents: [ 'GPTBot' ], type: 'training' },
	{ slug: 'ccbot', label: 'CCBot', userAgents: [ 'CCBot' ], type: 'training' },
];
const none: BlockedCrawlers = { answer: [], training: [] };

describe( 'blocked crawlers', () => {
	it.each( [
		[
			'blocks one crawler as a list',
			none,
			'gptbot',
			true,
			{ answer: [], training: [ 'gptbot' ] },
		],
		[
			'saves "all" once every crawler in the group is blocked',
			{ answer: [], training: [ 'gptbot' ] },
			'ccbot',
			true,
			{ answer: [], training: 'all' },
		],
		[
			'turns "all" into a list of the rest when one is allowed',
			{ answer: [], training: 'all' },
			'gptbot',
			false,
			{ answer: [], training: [ 'ccbot' ] },
		],
		[
			'drops slugs the catalog does not have in that group',
			{ answer: [], training: [ 'oai-searchbot', 'gone-bot' ] },
			'gptbot',
			true,
			{ answer: [], training: [ 'gptbot' ] },
		],
	] as const )( '%s', ( _, blocked, slug, isBlocked, expected ) => {
		expect( withCrawlerBlocked( blocked as BlockedCrawlers, catalog, slug, isBlocked ) ).toEqual(
			expected
		);
	} );

	it.each( [
		[ true, 'all' ],
		[ false, [] ],
	] )( 'sets the whole group when blocking is %s', ( isBlocked, expected ) => {
		expect(
			withGroupBlocked( { answer: [], training: [ 'gptbot' ] }, 'training', isBlocked )
		).toEqual( { answer: [], training: expected } );
	} );

	it( 'treats "all" as covering every crawler in that group only', () => {
		const blocked: BlockedCrawlers = { answer: [], training: 'all' };
		expect(
			catalog.filter( bot => isCrawlerBlocked( blocked, bot ) ).map( bot => bot.slug )
		).toEqual( [ 'gptbot', 'ccbot' ] );
	} );
} );
