import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { forwardRef } from 'react';
import type { GeoState } from '../../../data/geo-types';
import type { GeoForm } from '../../../data/use-geo';
import type { ReactNode } from 'react';

jest.unstable_mockModule( '@wordpress/route', () => ( {
	useNavigate: () => jest.fn(),
	Link: forwardRef<
		HTMLAnchorElement,
		{ to: string; search: Record< string, string >; children?: ReactNode }
	>( ( { to, search, children, ...props }, ref ) => (
		<a ref={ ref } href={ `${ to }?${ new URLSearchParams( search ) }` } { ...props }>
			{ children }
		</a>
	) ),
} ) );

const { default: GeoScreen } = await import( '../index' );

/**
 * Build a GEO-tab form whose llms.txt slice has the given serving state. The tab
 * renders straight from its `form` prop (no store/hooks), so this exercises the
 * honest "can't serve llms.txt" state directly.
 *
 * @param canServe - Whether WordPress can serve /llms.txt on this site.
 * @return A form controller for GeoScreen with the enhancer hidden.
 */
const formWith = ( canServe: boolean ): GeoForm => ( {
	enhancer: { available: false, enabled: false, aiSeoEnabled: true, aiEnabled: true },
	llmsTxt: { enabled: true, url: 'https://example.com/llms.txt', canServe },
	crawlers: null,
	isSaving: false,
	setEnhancerEnabled: () => {},
	setLlmsTxtEnabled: () => {},
	setCrawlerBlocked: () => {},
	setCrawlerGroupBlocked: () => {},
} );

/**
 * Build a form with crawler controls and selected environment flags.
 *
 * @param flags - Environment flags to override.
 * @return A form controller for GeoScreen.
 */
const crawlerForm = (
	flags: Partial<
		Pick<
			NonNullable< GeoState[ 'crawlers' ] >,
			| 'staticRobotsTxt'
			| 'dataSharingOptOut'
			| 'pathBasedMultisite'
			| 'restrictedSubdomain'
			| 'blocked'
		>
	> = {}
): GeoForm => ( {
	...formWith( true ),
	llmsTxt: null,
	crawlers: {
		catalog: [
			{
				slug: 'oai-searchbot',
				label: 'ChatGPT Search',
				userAgents: [ 'OAI-SearchBot' ],
				type: 'answer',
			},
			{
				slug: 'gptbot',
				label: 'ChatGPT',
				userAgents: [ 'GPTBot' ],
				type: 'training',
			},
			{
				slug: 'google-extended',
				label: 'Google Gemini',
				userAgents: [ 'Google-Extended' ],
				type: 'training',
			},
		],
		blocked: { answer: [], training: [] },
		searchEnginesVisible: true,
		restrictedSubdomain: false,
		staticRobotsTxt: false,
		dataSharingOptOut: false,
		dataSharingBlocked: [ 'gptbot', 'google-extended' ],
		pathBasedMultisite: false,
		privacySettingsUrl: 'http://example.com/wp-admin/options-reading.php',
		robotsTxtUrl: 'http://example.com/robots.txt',
		...flags,
	},
} );

describe( 'GeoScreen (GEO tab) — intro', () => {
	it( 'spells out the acronym at the top of the tab', () => {
		const { container } = render( <GeoScreen form={ allModulesForm() } searchEnginesVisible /> );

		const intro = screen.getByText(
			'GEO stands for generative engine optimization. These settings control how AI sees and uses your site.'
		);
		expect( intro.tagName ).toBe( 'P' );
		// The tab's own first child, so it sits above every module.
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- asserting its position in the tab.
		expect( container.querySelector( '.jetpack-seo-geo' )?.firstElementChild ).toBe( intro );
	} );
} );

describe( 'GeoScreen (GEO tab) — llms.txt serving state', () => {
	it( 'shows the view link and no warning when llms.txt can be served', () => {
		render( <GeoScreen form={ formWith( true ) } searchEnginesVisible /> );

		expect( screen.getByRole( 'link', { name: /view your llms\.txt/i } ) ).toBeInTheDocument();
		expect( screen.queryByText( /can't publish llms\.txt/i ) ).not.toBeInTheDocument();
	} );

	it( 'shows an honest notice and hides the view link when it cannot serve', () => {
		render( <GeoScreen form={ formWith( false ) } searchEnginesVisible /> );

		// The @wordpress/ui Notice renders its text in more than one node, so match
		// with getAllByText (see schema-card.test.tsx) rather than getByText.
		expect( screen.getAllByText( /can't publish llms\.txt/i ).length ).toBeGreaterThan( 0 );
		expect(
			screen.queryByRole( 'link', { name: /view your llms\.txt/i } )
		).not.toBeInTheDocument();
	} );

	it( 'disables llms.txt and links to visibility settings when indexing is blocked', () => {
		render( <GeoScreen form={ formWith( true ) } searchEnginesVisible={ false } /> );

		const toggle = screen.getByRole( 'switch', { name: /generate an llms\.txt file/i } );
		expect( toggle ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( toggle ).not.toBeChecked();
		expect( screen.getAllByText( /to enable, allow search engines/i ).length ).toBeGreaterThan( 0 );
		expect( screen.getByRole( 'link', { name: 'Open site visibility settings' } ) ).toHaveAttribute(
			'href',
			'/settings?focus=visibility'
		);
		expect(
			screen.queryByRole( 'link', { name: /view your llms\.txt/i } )
		).not.toBeInTheDocument();
	} );
} );

describe( 'GeoScreen (GEO tab) — crawler policy state', () => {
	it( 'files Google-Extended under Training, not its own module', () => {
		render( <GeoScreen form={ crawlerForm() } searchEnginesVisible /> );

		expect( screen.getByText( 'Training crawlers' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Block Google Gemini' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Google-Extended' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'AI answers and training' ) ).not.toBeInTheDocument();
	} );

	it( 'tags each group header with its allow/block status', () => {
		render(
			<GeoScreen
				form={ crawlerForm( { blocked: { answer: [], training: 'all' } } ) }
				searchEnginesVisible
			/>
		);
		const answerHeader = screen.getByRole( 'button', { name: /answer engines/i } );
		const trainingHeader = screen.getByRole( 'button', { name: /training crawlers/i } );
		expect( within( answerHeader ).getByText( 'Allowed' ) ).toBeInTheDocument();
		expect( within( trainingHeader ).getByText( 'Blocked' ) ).toBeInTheDocument();
	} );

	it( 'tags a mixed group as partly blocked', () => {
		// Block one of the two training bots so the group is neither all-allowed nor all-blocked.
		render(
			<GeoScreen
				form={ crawlerForm( { blocked: { answer: [], training: [ 'google-extended' ] } } ) }
				searchEnginesVisible
			/>
		);
		const trainingHeader = screen.getByRole( 'button', { name: /training crawlers/i } );
		expect( within( trainingHeader ).getByText( 'Partly blocked' ) ).toBeInTheDocument();
	} );

	it.each( [
		[ 'Block ChatGPT', 0, 'setCrawlerBlocked', 'gptbot' ],
		[ 'Block all', 1, 'setCrawlerGroupBlocked', 'training' ],
	] as const )( 'blocks when "%s" is switched on', ( name, index, setter, target ) => {
		const form = { ...crawlerForm(), [ setter ]: jest.fn() };
		render( <GeoScreen form={ form } searchEnginesVisible /> );

		// Collapsed panels hide the toggles, so include hidden ones.
		const toggle = screen.getAllByRole( 'switch', { name, hidden: true } )[ index ];
		expect( toggle ).not.toBeChecked();
		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep for a single click.
		fireEvent.click( toggle );
		expect( form[ setter ] ).toHaveBeenCalledWith( target, true );
	} );

	it( 'links each group to the robots.txt file under its description', () => {
		render( <GeoScreen form={ crawlerForm() } searchEnginesVisible /> );

		// The link sits under the description, inside the collapsed panel — include hidden.
		const links = screen.getAllByRole( 'link', { name: /view your robots\.txt/i, hidden: true } );
		expect( links ).toHaveLength( 2 ); // one per group
		links.forEach( link =>
			expect( link ).toHaveAttribute( 'href', 'http://example.com/robots.txt' )
		);
	} );

	it( 'shows the opt-out state, disabled with a link, under the data-sharing opt-out', () => {
		render(
			<GeoScreen
				// The owner's block is ignored while the opt-out decides robots.txt.
				form={ crawlerForm( {
					dataSharingOptOut: true,
					blocked: { answer: [ 'oai-searchbot' ], training: [] },
				} ) }
				searchEnginesVisible
			/>
		);

		// The explanation + link sit in the header area, visible while the modules
		// stay collapsed (the setting governs, so the user can just follow the link).
		expect( screen.getAllByText( /third-party sharing is turned off/i ).length ).toBeGreaterThan(
			0
		);
		const link = screen.getAllByRole( 'link', { name: /manage sharing settings/i } )[ 0 ];
		expect( link ).toHaveAttribute( 'href', 'http://example.com/wp-admin/options-reading.php' );
		// The (collapsed) toggles are disabled — include hidden so the closed panel counts.
		const switches = screen.getAllByRole( 'switch', { hidden: true } );
		expect( switches.length ).toBeGreaterThan( 0 );
		expect( switches.every( el => el.getAttribute( 'aria-disabled' ) === 'true' ) ).toBe( true );
		const toggle = ( name: string ) => screen.getByRole( 'switch', { name, hidden: true } );
		expect( toggle( 'Block ChatGPT Search' ) ).not.toBeChecked();
		expect( toggle( 'Block ChatGPT' ) ).toBeChecked();
		expect( toggle( 'Block Google Gemini' ) ).toBeChecked();
		const answerHeader = screen.getByRole( 'button', { name: /answer engines/i } );
		const trainingHeader = screen.getByRole( 'button', { name: /training crawlers/i } );
		expect( within( answerHeader ).getByText( 'Allowed' ) ).toBeInTheDocument();
		expect( within( trainingHeader ).getByText( 'Blocked' ) ).toBeInTheDocument();
	} );

	it( 'links the not-indexed notice to the visibility settings', () => {
		render( <GeoScreen form={ crawlerForm() } searchEnginesVisible={ false } /> );

		expect( screen.getAllByText( /isn't set to be indexed/i ).length ).toBeGreaterThan( 0 );
		expect( screen.getByRole( 'link', { name: 'Open site visibility settings' } ) ).toHaveAttribute(
			'href',
			'/settings?focus=visibility'
		);
		expect( screen.queryByText( 'Block Google Gemini' ) ).not.toBeInTheDocument();
	} );

	it( 'hides per-site controls on path-based multisite', () => {
		render(
			<GeoScreen form={ crawlerForm( { pathBasedMultisite: true } ) } searchEnginesVisible />
		);

		expect( screen.getAllByText( /shares one robots\.txt/i ).length ).toBeGreaterThan( 0 );
		expect( screen.queryByText( 'Block Google Gemini' ) ).not.toBeInTheDocument();
	} );

	it( 'explains a staging subdomain instead of offering controls', () => {
		render(
			<GeoScreen form={ crawlerForm( { restrictedSubdomain: true } ) } searchEnginesVisible />
		);

		expect( screen.getAllByText( /temporary staging address/i ).length ).toBeGreaterThan( 0 );
		expect( screen.queryByText( 'Block Google Gemini' ) ).not.toBeInTheDocument();
	} );

	it( 'accurately describes a detected static robots.txt file', () => {
		render( <GeoScreen form={ crawlerForm( { staticRobotsTxt: true } ) } searchEnginesVisible /> );

		expect(
			screen.getAllByText( /static robots\.txt file in the WordPress installation directory/i )
				.length
		).toBeGreaterThan( 0 );
		expect( screen.queryByText( /can't reach.*robots\.txt/i ) ).not.toBeInTheDocument();
	} );
} );

/**
 * A form with every module visible at once, so the title treatment can be checked
 * across all four. The other fixtures deliberately switch modules off.
 *
 * @return A form controller with crawlers, llms.txt and the enhancer all present.
 */
const allModulesForm = (): GeoForm => ( {
	// Training crawlers blocked, so the two crawler groups show different badges.
	...crawlerForm( { blocked: { answer: [], training: 'all' } } ),
	enhancer: { available: true, enabled: false, aiSeoEnabled: true, aiEnabled: true },
	llmsTxt: { enabled: true, url: 'https://example.com/llms.txt', canServe: true },
} );

describe( 'GeoScreen (GEO tab) — module titles', () => {
	// The icon must not swallow the title text, which is how these modules are found
	// by assistive tech and by every other test in this file.
	it( 'leads every module title with an icon, keeping the title readable', () => {
		render( <GeoScreen form={ allModulesForm() } searchEnginesVisible /> );

		for ( const title of [
			'Answer engines',
			'Training crawlers',
			'llms.txt',
			'AI SEO Enhancer',
		] ) {
			// `getByText` resolves to the title wrapper, whose text is the title alone —
			// the glyph beside it is a decorative SVG with no role of its own.
			const heading = screen.getByText( title );
			expect( heading ).toBeInTheDocument();
			// eslint-disable-next-line testing-library/no-node-access -- asserting the decorative glyph rendered.
			expect( heading.querySelector( 'svg' ) ).toBeInTheDocument();
		}
	} );

	// The two crawler groups are opposite decisions about the same content, so a
	// shared glyph would hide the only distinction on the tab that needs acting on.
	it( 'gives the two crawler groups different glyphs', () => {
		render( <GeoScreen form={ allModulesForm() } searchEnginesVisible /> );

		const glyphOf = ( title: string ) =>
			// eslint-disable-next-line testing-library/no-node-access -- comparing the two decorative glyphs.
			screen.getByText( title ).querySelector( 'svg' )?.innerHTML;

		expect( glyphOf( 'Answer engines' ) ).toBeTruthy();
		expect( glyphOf( 'Answer engines' ) ).not.toBe( glyphOf( 'Training crawlers' ) );
	} );

	// `Card.Title` and `CollapsibleCard.Header` both default to a div, so without
	// opting in the tab has no heading structure to navigate at all.
	//
	// The names are matched EXACTLY on purpose: the header wraps all its children in
	// the trigger, so a state badge left beside the title would land in the button's
	// accessible name ("Answer enginesAllowed"). These assertions only pass while the
	// badges stay in `HeaderDescription`, which is `aria-hidden` and surfaced through
	// `aria-describedby` instead.
	it( 'renders each module header as a heading, named by its title alone', () => {
		render( <GeoScreen form={ allModulesForm() } searchEnginesVisible /> );

		for ( const title of [
			'Answer engines',
			'Training crawlers',
			'llms.txt',
			'AI SEO Enhancer',
		] ) {
			const trigger = screen.getByRole( 'button', { name: title } );
			// eslint-disable-next-line testing-library/no-node-access -- the heading/trigger nesting is the contract.
			expect( trigger.closest( 'h2' ) ).toBeInTheDocument();
		}
	} );

	// Only the two crawler groups carry a state tag. The other modules open by
	// default, so their toggle — the same fact, in the control that changes it — is
	// already on screen; a tag would state it twice. If one of them ever opens
	// closed, it needs a tag, and this test should be the thing that says so.
	// Collapsing one hides its state until reopened: an accepted trade-off, not an
	// oversight — see the comment on the llms.txt header.
	it( 'gives no state tag to the modules that open by default', () => {
		render( <GeoScreen form={ allModulesForm() } searchEnginesVisible /> );

		for ( const title of [ 'llms.txt', 'AI SEO Enhancer' ] ) {
			expect( screen.getByRole( 'button', { name: title } ) ).not.toHaveAttribute(
				'aria-describedby'
			);
		}
	} );

	// A partly-blocked group used to be grey — indistinguishable from a module that
	// is simply switched off, which made it the one state you couldn't read from the
	// header. Amber is what separates them, so the intent is worth pinning down.
	it( 'marks a partly-blocked group amber, distinct from allowed and blocked', () => {
		// `gptbot` allowed, `google-extended` blocked.
		render(
			<GeoScreen
				form={ crawlerForm( { blocked: { answer: [], training: [ 'google-extended' ] } } ) }
				searchEnginesVisible
			/>
		);

		// The class name is hashed by the CSS-module build, so match the stable suffix
		// rather than a literal. Asserted on `className` (a string) instead of via
		// `toHaveClass`, whose types don't admit a pattern.
		expect( screen.getByText( 'Partly blocked' ).className ).toMatch( /is-medium-intent/ );
	} );

	// The badge must stay visible — this is an accessibility relocation, not a
	// removal. Asserting it through the trigger's `aria-describedby` target proves
	// both halves at once: the badge still renders, and it now reaches assistive
	// tech as the trigger's description instead of part of its name.
	it( 'keeps each state badge on screen, wired as the trigger description', () => {
		render( <GeoScreen form={ allModulesForm() } searchEnginesVisible /> );

		for ( const [ title, state ] of [
			[ 'Answer engines', 'Allowed' ],
			[ 'Training crawlers', 'Blocked' ],
		] ) {
			const describedBy = screen
				.getByRole( 'button', { name: title } )
				.getAttribute( 'aria-describedby' );
			expect( describedBy ).toBeTruthy();

			// eslint-disable-next-line testing-library/no-node-access -- resolving an id reference is the point.
			const description = document.getElementById( describedBy as string );
			expect( description ).toBeVisible();
			expect( description ).toHaveTextContent( state );
		}
	} );

	// Only one blocked state renders at a time, and it stands for both crawler
	// groups — so it carries the combined glyph rather than either group's.
	it( 'still gives the blocked state its title and icon', () => {
		render(
			<GeoScreen form={ crawlerForm( { pathBasedMultisite: true } ) } searchEnginesVisible />
		);

		const heading = screen.getByText( 'AI crawler access' );
		// eslint-disable-next-line testing-library/no-node-access -- asserting the decorative glyph rendered.
		expect( heading.querySelector( 'svg' ) ).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-node-access -- the heading/trigger nesting is the contract.
		expect( screen.getByText( 'AI crawler access' ).closest( 'h2' ) ).toBeInTheDocument();
	} );
} );

describe( 'GeoScreen (GEO tab) — the AI SEO Enhancer card', () => {
	// Same treatment the Traffic page gives it: disabled with an explanation
	// rather than hidden, so the saved choice stays visible.
	it.each( [
		[ 'the AI SEO control', true, /AI SEO is turned off for this site/ ],
		[ 'Jetpack AI', false, /Jetpack AI is turned off for this site/ ],
	] )( 'disables the toggle and explains why while %s is off', ( _, aiEnabled, message ) => {
		render(
			<GeoScreen
				form={ {
					...allModulesForm(),
					enhancer: { available: true, enabled: true, aiSeoEnabled: false, aiEnabled },
				} }
				searchEnginesVisible
			/>
		);

		expect(
			screen.getByRole( 'switch', { name: /Automatically generate SEO title/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );
		expect( screen.getByText( message ) ).toBeInTheDocument();
	} );

	it( 'leaves the toggle usable while the AI SEO control is on', () => {
		render(
			<GeoScreen
				form={ {
					...allModulesForm(),
					enhancer: { available: true, enabled: true, aiSeoEnabled: true, aiEnabled: true },
				} }
				searchEnginesVisible
			/>
		);

		expect(
			screen.getByRole( 'switch', { name: /Automatically generate SEO title/ } )
		).not.toHaveAttribute( 'aria-disabled' );
		expect( screen.queryByText( /AI SEO is turned off for this site/ ) ).not.toBeInTheDocument();
	} );
} );
