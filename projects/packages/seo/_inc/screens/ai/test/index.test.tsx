import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen, within } from '@testing-library/react';
import AiScreen from '../index';
import type { AiState } from '../../../data/ai-types';
import type { AiForm } from '../../../data/use-ai';

/**
 * Build a GEO-tab form whose llms.txt slice has the given serving state. The tab
 * renders straight from its `form` prop (no store/hooks), so this exercises the
 * honest "can't serve llms.txt" state directly.
 *
 * @param canServe - Whether WordPress can serve /llms.txt on this site.
 * @return A form controller for AiScreen with the enhancer hidden.
 */
const formWith = ( canServe: boolean ): AiForm => ( {
	enhancer: { available: false, enabled: false },
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
 * @return A form controller for AiScreen.
 */
const crawlerForm = (
	flags: Partial<
		Pick<
			NonNullable< AiState[ 'crawlers' ] >,
			| 'staticRobotsTxt'
			| 'dataSharingOptOut'
			| 'pathBasedMultisite'
			| 'restrictedSubdomain'
			| 'overrides'
		>
	> = {}
): AiForm => ( {
	...formWith( true ),
	llmsTxt: null,
	crawlers: {
		catalog: [
			{
				slug: 'oai-searchbot',
				label: 'ChatGPT Search (OAI-SearchBot)',
				userAgent: 'OAI-SearchBot',
				type: 'answer',
			},
			{
				slug: 'gptbot',
				label: 'ChatGPT (GPTBot)',
				userAgent: 'GPTBot',
				type: 'training',
			},
			{
				slug: 'google-extended',
				label: 'Google Gemini (Google-Extended)',
				userAgent: 'Google-Extended',
				type: 'training',
			},
		],
		overrides: {},
		searchEnginesVisible: true,
		restrictedSubdomain: false,
		staticRobotsTxt: false,
		dataSharingOptOut: false,
		pathBasedMultisite: false,
		privacySettingsUrl: 'http://example.com/wp-admin/options-reading.php',
		robotsTxtUrl: 'http://example.com/robots.txt',
		...flags,
	},
} );

const noop = () => {};

describe( 'AiScreen (GEO tab) — llms.txt serving state', () => {
	it( 'shows the view link and no warning when llms.txt can be served', () => {
		render(
			<AiScreen form={ formWith( true ) } searchEnginesVisible onManageVisibility={ noop } />
		);

		expect( screen.getByRole( 'link', { name: /view your llms\.txt/i } ) ).toBeInTheDocument();
		expect( screen.queryByText( /can't publish llms\.txt/i ) ).not.toBeInTheDocument();
	} );

	it( 'shows an honest notice and hides the view link when it cannot serve', () => {
		render(
			<AiScreen form={ formWith( false ) } searchEnginesVisible onManageVisibility={ noop } />
		);

		// The @wordpress/ui Notice renders its text in more than one node, so match
		// with getAllByText (see schema-card.test.tsx) rather than getByText.
		expect( screen.getAllByText( /can't publish llms\.txt/i ).length ).toBeGreaterThan( 0 );
		expect(
			screen.queryByRole( 'link', { name: /view your llms\.txt/i } )
		).not.toBeInTheDocument();
	} );

	it( 'disables llms.txt and links to visibility settings when indexing is blocked', () => {
		const onManageVisibility = jest.fn();
		render(
			<AiScreen
				form={ formWith( true ) }
				searchEnginesVisible={ false }
				onManageVisibility={ onManageVisibility }
			/>
		);

		expect(
			screen.getByRole( 'checkbox', { name: /generate an llms\.txt file/i } )
		).toBeDisabled();
		expect(
			screen.getByRole( 'checkbox', { name: /generate an llms\.txt file/i } )
		).not.toBeChecked();
		expect( screen.getAllByText( /to enable, allow search engines/i ).length ).toBeGreaterThan( 0 );
		expect(
			screen.queryByRole( 'link', { name: /view your llms\.txt/i } )
		).not.toBeInTheDocument();

		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep for a single click.
		fireEvent.click( screen.getByRole( 'button', { name: /settings/i } ) );
		expect( onManageVisibility ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'AiScreen (GEO tab) — crawler policy state', () => {
	it( 'files Google-Extended under Training, not its own module', () => {
		render( <AiScreen form={ crawlerForm() } searchEnginesVisible onManageVisibility={ noop } /> );

		expect( screen.getByText( 'Training crawlers' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Google Gemini (Google-Extended)' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'AI answers and training' ) ).not.toBeInTheDocument();
	} );

	it( 'tags each group header with its allow/block status', () => {
		// Defaults: answer engines allowed, training crawlers blocked.
		render( <AiScreen form={ crawlerForm() } searchEnginesVisible onManageVisibility={ noop } /> );
		const answerHeader = screen.getByRole( 'button', { name: /answer engines/i } );
		const trainingHeader = screen.getByRole( 'button', { name: /training crawlers/i } );
		expect( within( answerHeader ).getByText( 'Allowed' ) ).toBeInTheDocument();
		expect( within( trainingHeader ).getByText( 'Blocked' ) ).toBeInTheDocument();
	} );

	it( 'tags a mixed group as partly blocked', () => {
		// Allow one of the two training bots so the group is neither all-allowed nor all-blocked.
		render(
			<AiScreen
				form={ crawlerForm( { overrides: { gptbot: false } } ) }
				searchEnginesVisible
				onManageVisibility={ noop }
			/>
		);
		const trainingHeader = screen.getByRole( 'button', { name: /training crawlers/i } );
		expect( within( trainingHeader ).getByText( 'Partly blocked' ) ).toBeInTheDocument();
	} );

	it( 'links each group to the robots.txt file under its description', () => {
		render( <AiScreen form={ crawlerForm() } searchEnginesVisible onManageVisibility={ noop } /> );

		// The link sits under the description, inside the collapsed panel — include hidden.
		const links = screen.getAllByRole( 'link', { name: /view your robots\.txt/i, hidden: true } );
		expect( links ).toHaveLength( 2 ); // one per group
		links.forEach( link =>
			expect( link ).toHaveAttribute( 'href', 'http://example.com/robots.txt' )
		);
	} );

	it( 'disables the crawler controls and links to the setting under the data-sharing opt-out', () => {
		render(
			<AiScreen
				form={ crawlerForm( { dataSharingOptOut: true } ) }
				searchEnginesVisible
				onManageVisibility={ noop }
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
		const boxes = screen.getAllByRole( 'checkbox', { hidden: true } );
		expect( boxes.length ).toBeGreaterThan( 0 );
		expect( boxes.every( box => box.hasAttribute( 'disabled' ) ) ).toBe( true );
		// The allow/block status tags are hidden while the setting governs the group.
		const trainingHeader = screen.getByRole( 'button', { name: /training crawlers/i } );
		expect( within( trainingHeader ).queryByText( 'Blocked' ) ).not.toBeInTheDocument();
	} );

	it( 'hides per-site controls on path-based multisite', () => {
		render(
			<AiScreen
				form={ crawlerForm( { pathBasedMultisite: true } ) }
				searchEnginesVisible
				onManageVisibility={ noop }
			/>
		);

		expect( screen.getAllByText( /shares one robots\.txt/i ).length ).toBeGreaterThan( 0 );
		expect( screen.queryByText( 'Google Gemini (Google-Extended)' ) ).not.toBeInTheDocument();
	} );

	it( 'explains a staging subdomain instead of offering controls', () => {
		render(
			<AiScreen
				form={ crawlerForm( { restrictedSubdomain: true } ) }
				searchEnginesVisible
				onManageVisibility={ noop }
			/>
		);

		expect( screen.getAllByText( /temporary staging address/i ).length ).toBeGreaterThan( 0 );
		expect( screen.queryByText( 'Google Gemini (Google-Extended)' ) ).not.toBeInTheDocument();
	} );

	it( 'accurately describes a detected static robots.txt file', () => {
		render(
			<AiScreen
				form={ crawlerForm( { staticRobotsTxt: true } ) }
				searchEnginesVisible
				onManageVisibility={ noop }
			/>
		);

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
const allModulesForm = (): AiForm => ( {
	...crawlerForm(),
	enhancer: { available: true, enabled: false },
	llmsTxt: { enabled: true, url: 'https://example.com/llms.txt', canServe: true },
} );

describe( 'AiScreen (GEO tab) — module titles', () => {
	// The chip must not swallow the title text, which is how these modules are found
	// by assistive tech and by every other test in this file.
	it( 'leads every module title with an icon chip, keeping the title readable', () => {
		render(
			<AiScreen form={ allModulesForm() } searchEnginesVisible onManageVisibility={ noop } />
		);

		for ( const title of [
			'Answer engines',
			'Training crawlers',
			'llms.txt',
			'AI SEO Enhancer',
		] ) {
			// `getByText` resolves to the chip wrapper, whose text is the title alone —
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
		render(
			<AiScreen form={ allModulesForm() } searchEnginesVisible onManageVisibility={ noop } />
		);

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
		render(
			<AiScreen form={ allModulesForm() } searchEnginesVisible onManageVisibility={ noop } />
		);

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
		render(
			<AiScreen form={ allModulesForm() } searchEnginesVisible onManageVisibility={ noop } />
		);

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
		// `gptbot` allowed, `google-extended` left at the training default of blocked.
		render(
			<AiScreen
				form={ crawlerForm( { overrides: { gptbot: false } } ) }
				searchEnginesVisible
				onManageVisibility={ noop }
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
	// tech as the trigger's description instead of part of its name. (A bare text
	// query would be ambiguous — the toggles inside the expanded content say
	// "Allowed" too.)
	it( 'keeps each state badge on screen, wired as the trigger description', () => {
		render(
			<AiScreen form={ allModulesForm() } searchEnginesVisible onManageVisibility={ noop } />
		);

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
	it( 'still titles and chips the blocked state', () => {
		render(
			<AiScreen
				form={ crawlerForm( { pathBasedMultisite: true } ) }
				searchEnginesVisible
				onManageVisibility={ noop }
			/>
		);

		const heading = screen.getByText( 'AI crawler access' );
		// eslint-disable-next-line testing-library/no-node-access -- asserting the decorative glyph rendered.
		expect( heading.querySelector( 'svg' ) ).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-node-access -- the heading/trigger nesting is the contract.
		expect( screen.getByText( 'AI crawler access' ).closest( 'h2' ) ).toBeInTheDocument();
	} );
} );
