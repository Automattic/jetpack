import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import AiCrawlerCard from '../ai-crawler-card';
import type { AiState } from '../../../data/ai-types';

type Crawlers = NonNullable< AiState[ 'crawlers' ] >;
type LlmsTxt = AiState[ 'llmsTxt' ];

/**
 * Build a crawler payload where the per-crawler settings apply, so the card
 * shows its status rows rather than a blocking-reason sentence.
 *
 * @param overrides - Fields to override on the default payload.
 * @return The crawler payload.
 */
const buildCrawlers = ( overrides: Partial< Crawlers > = {} ): Crawlers =>
	( {
		catalog: [
			{ slug: 'oai-searchbot', label: 'OAI-SearchBot', userAgent: 'OAI-SearchBot', type: 'answer' },
			{ slug: 'perplexity', label: 'PerplexityBot', userAgent: 'PerplexityBot', type: 'answer' },
			{ slug: 'gptbot', label: 'GPTBot', userAgent: 'GPTBot', type: 'training' },
		],
		overrides: {},
		searchEnginesVisible: true,
		restrictedSubdomain: false,
		staticRobotsTxt: false,
		dataSharingOptOut: false,
		pathBasedMultisite: false,
		privacySettingsUrl: 'https://example.test/privacy',
		robotsTxtUrl: 'https://example.test/robots.txt',
		...overrides,
	} ) as Crawlers;

/**
 * Build an llms.txt payload.
 *
 * @param overrides - Fields to override on the default payload.
 * @return The llms.txt payload.
 */
const buildLlms = ( overrides: Partial< NonNullable< LlmsTxt > > = {} ): LlmsTxt => ( {
	enabled: true,
	url: 'https://example.test/llms.txt',
	canServe: true,
	...overrides,
} );

/**
 * Render the card with sensible defaults.
 *
 * @param props          - Overrides.
 * @param props.crawlers - Crawler payload.
 * @param props.llmsTxt  - llms.txt payload.
 * @param props.visible  - Whether search engines may index the site.
 * @return The render result.
 */
const renderCard = ( {
	crawlers = buildCrawlers(),
	llmsTxt = buildLlms(),
	visible = true,
}: { crawlers?: Crawlers; llmsTxt?: LlmsTxt; visible?: boolean } = {} ) =>
	render(
		<AiCrawlerCard
			data={ crawlers }
			searchEnginesVisible={ visible }
			llmsTxt={ llmsTxt }
			onManage={ jest.fn() }
		/>
	);

describe( 'AiCrawlerCard', () => {
	it( 'is titled for access, not for crawlers', () => {
		renderCard();

		// "Crawler" is jargon for the first screen someone lands on; the term is kept
		// inside the card ("Training crawlers") where it's a detail you can act on.
		expect( screen.getByRole( 'heading', { level: 2, name: /AI access/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Manage AI access' } ) ).toBeInTheDocument();
		expect( screen.queryByText( /AI crawler access/ ) ).not.toBeInTheDocument();
	} );

	it( 'reports the crawler groups alongside llms.txt', () => {
		renderCard();

		expect( screen.getByText( 'Answer engines: 2 of 2 allowed' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Training crawlers: 1 of 1 blocked' ) ).toBeInTheDocument();
		expect( screen.getByText( 'llms.txt published' ) ).toBeInTheDocument();
	} );

	it( 'reads as not published only when Jetpack could publish one and it is off', () => {
		renderCard( { llmsTxt: buildLlms( { enabled: false } ) } );

		expect( screen.getByText( 'llms.txt not published' ) ).toBeInTheDocument();
	} );

	it.each( [
		[ 'a static file already answers that path', true ],
		[ 'the host fronts that path', false ],
	] )( 'still reads as published when %s', ( _label, enabled ) => {
		// `canServe: false` means something else is already serving /llms.txt, so an
		// llms.txt exists (or we cannot see that it doesn't). Calling that "not
		// published" would state something we don't know and can't fix here — the
		// GEO tab is where ownership gets explained.
		renderCard( { llmsTxt: buildLlms( { canServe: false, enabled } ) } );

		expect( screen.getByText( 'llms.txt published' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'llms.txt not published' ) ).not.toBeInTheDocument();
	} );

	it( 'drops every status row for the blocking reason when the site is closed to search', () => {
		renderCard( { visible: false } );

		expect(
			screen.getByText( "AI crawlers can't reach this site while search engines are blocked." )
		).toBeInTheDocument();
		// The llms row goes with them — it can't be published while indexing is off.
		expect( screen.queryByText( /llms\.txt/ ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /Answer engines/ ) ).not.toBeInTheDocument();
	} );

	it( 'omits the llms.txt row entirely when the slice is missing', () => {
		renderCard( { llmsTxt: null } );

		expect( screen.getByText( /Answer engines/ ) ).toBeInTheDocument();
		expect( screen.queryByText( /llms\.txt/ ) ).not.toBeInTheDocument();
	} );
} );
