/* eslint-disable react/jsx-no-bind */

import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import type { SiteData } from '../../../data/get-site';
import type { TitleFormatToken } from '../../../data/settings-types';

// `--experimental-vm-modules` (true ESM): register the mock, then import the
// component dynamically. `getSite()` reads the page bootstrap, which doesn't
// exist under jsdom.
let site: SiteData | null;

jest.unstable_mockModule( '../../../data/get-site', () => ( {
	default: () => site,
} ) );

// Real class names for the preview parts. Without this jest resolves every key to
// `undefined`, and an assertion that a span "has" that class passes vacuously —
// which is exactly the bug this test exists to catch (see #50619).
jest.unstable_mockModule( '../title-structure-field.module.scss', () => ( {
	default: {
		previewValue: 'preview-value',
		previewSeparator: 'preview-separator',
		row: 'row',
		muted: 'muted',
		preview: 'preview',
		save: 'save',
	},
} ) );

const { default: TitleStructureField } = await import( '../title-structure-field' );

const SITE: SiteData = {
	title: 'Acme Co',
	tagline: 'We make things',
	url: 'https://example.com',
	icon: '',
	image: '',
};

/**
 * Render the module with the given stored formats. Page types absent from
 * `formats` are untouched, which is the case the default preview exists for.
 *
 * @param formats - Stored title formats, keyed by page type.
 * @return The render result.
 */
const renderField = ( formats: Record< string, TitleFormatToken[] > = {} ) =>
	render(
		<TitleStructureField
			formats={ formats }
			onChange={ jest.fn() }
			onSaveFormat={ jest.fn() }
			isFormatDirty={ () => false }
			titleSeparator="-"
			editable
		/>
	);

/**
 * Open the module — like the other Settings cards it renders collapsed.
 *
 * @return Whether the click event was dispatched.
 */
const expand = () =>
	// eslint-disable-next-line testing-library/prefer-user-event -- single click; fireEvent avoids the user-event devDep (lockfile churn).
	fireEvent.click( screen.getByRole( 'button', { name: /Title structure/ } ) );

/**
 * The rendered preview for every page-type row, as plain strings.
 *
 * Previews render as chips and separators rather than one text node, so no
 * `getByText` can match a whole title. Reading each row's `textContent` back is
 * the stronger assertion anyway: it proves the parts *concatenate* to exactly
 * the title that would be emitted, which is the whole promise of the preview.
 * The "Preview:" label is stripped; surrounding whitespace is left alone so the
 * separator spacing stays assertable.
 *
 * @return One string per rendered row.
 */
const previews = (): string[] =>
	screen
		.getAllByText( 'Preview:' )
		.map( label => ( label.parentElement?.textContent ?? '' ).replace( /^Preview:/, '' ) );

describe( 'TitleStructureField', () => {
	beforeEach( () => {
		site = SITE;
	} );

	// The rule is deliberate and load-bearing (JETPACK-2051): an untouched page
	// type still produces a title, so nothing here is ever unfinished. Without
	// this, reverting to a count-based status passes the rest of the suite.
	describe( 'completion status', () => {
		it( 'reports complete with no formats stored at all', () => {
			renderField();
			expect( screen.getByText( 'Complete' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Not started' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'In progress' ) ).not.toBeInTheDocument();
		} );

		it( 'still reports complete when only some page types are customized', () => {
			renderField( { posts: [ { type: 'token', value: 'post_title' } ] } );
			expect( screen.getByText( 'Complete' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'In progress' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'previews', () => {
		it( 'previews the default title for an untouched page type', () => {
			renderField();
			expand();
			// Core pairs the page-specific title with the site title everywhere but
			// the front page, where it pairs the site title with the tagline. Each
			// preview is unique, so no per-row scoping is needed.
			expect( previews() ).toContainEqual( expect.stringMatching( /Hello World - Acme Co/ ) );
			expect( previews() ).toContainEqual( expect.stringMatching( /Acme Co - We make things/ ) );
		} );

		it( 'marks an untouched field as using the default', () => {
			renderField();
			expand();
			expect( screen.getByRole( 'textbox', { name: 'Posts' } ) ).toHaveAttribute(
				'placeholder',
				'Using the default title'
			);
		} );

		// The preview is split into elements so the title's structure is legible:
		// values chipped, separators left as plain text. What matters is that the
		// split is faithful — concatenating the pieces has to give the exact title,
		// with the admin's own spacing intact.
		it( 'splits the preview into values and separators without altering the title', () => {
			renderField( {
				posts: [
					{ type: 'token', value: 'post_title' },
					{ type: 'string', value: ' | ' },
					{ type: 'token', value: 'site_name' },
				],
			} );
			expand();

			// Every page type renders a row, so pick the one under test by its content
			// rather than by position — the row order is not this test's subject.
			const row = screen
				.getAllByText( 'Preview:' )
				// eslint-disable-next-line testing-library/no-node-access -- asserting the DOM split is this test's subject; no TL query exposes sibling structure.
				.map( label => label.parentElement! )
				.find( node => node.textContent?.includes( 'Hello World' ) )!;
			// eslint-disable-next-line testing-library/no-node-access -- see above.
			const parts = Array.from( row.querySelectorAll( 'span' ) ).map( node => node.textContent );

			// Three pieces, in order, with the separator kept as its own part and its
			// surrounding spaces intact in the DOM. (The `white-space: pre` that stops
			// the browser collapsing those spaces on screen is a stylesheet concern —
			// jsdom applies no CSS, so it can't be asserted here.)
			expect( parts ).toEqual( [ 'Hello World', ' | ', 'Acme Co' ] );
			expect( parts.join( '' ) ).toBe( 'Hello World | Acme Co' );

			// And the two kinds are distinguishable, which the text alone doesn't show:
			// values are chipped, the separator is not. Without this, rendering every
			// part identically would still satisfy the assertions above.
			// eslint-disable-next-line testing-library/no-node-access -- see above.
			const spans = Array.from( row.querySelectorAll( 'span' ) );
			expect( spans.map( node => node.className ) ).toEqual( [
				'preview-value',
				'preview-separator',
				'preview-value',
			] );
		} );

		it( 'previews a stored format from its tokens', () => {
			renderField( {
				posts: [
					{ type: 'token', value: 'post_title' },
					{ type: 'string', value: ' | ' },
					{ type: 'token', value: 'site_name' },
				],
			} );
			expand();
			expect( previews() ).toContainEqual( expect.stringMatching( /Hello World \| Acme Co/ ) );
		} );
	} );

	// A site can have no tagline. The preview says so honestly rather than
	// substituting sample text for a value the site doesn't have.
	describe( 'empty site values', () => {
		beforeEach( () => {
			site = { ...SITE, tagline: '' };
		} );

		it( 'drops an empty part from a default title, as core does', () => {
			renderField();
			expand();
			// The front page pairs site title + tagline; with no tagline core drops
			// that part rather than leaving a dangling separator.
			expect( previews() ).toContainEqual( expect.stringMatching( /^\s*Acme Co\s*$/ ) );
			expect( screen.queryByText( /Your tagline/ ) ).not.toBeInTheDocument();
		} );

		it( 'keeps the separator in a custom format, as Jetpack does', () => {
			renderField( {
				front_page: [
					{ type: 'token', value: 'site_name' },
					{ type: 'string', value: ' - ' },
					{ type: 'token', value: 'tagline' },
				],
			} );
			expand();
			expect( previews() ).toContainEqual( expect.stringMatching( /^\s*Acme Co -\s*$/ ) );
			expect( screen.queryByText( /Your tagline/ ) ).not.toBeInTheDocument();
		} );

		// Regression: gating the preview on a non-empty string hid it entirely for a
		// format that evaluates to nothing — the opposite of previewing honestly.
		it( 'still shows the preview line for a custom format that renders nothing', () => {
			renderField( { front_page: [ { type: 'token', value: 'tagline' } ] } );
			expand();
			// Every page type keeps its preview line, including the one that renders
			// nothing — hiding it would undo the point of previewing honestly.
			expect( screen.getAllByText( /^Preview:/ ) ).toHaveLength( 5 );
		} );
	} );

	// Absent bootstrap data is "unknown", not "empty": sample text still stands in,
	// so a failed load can't masquerade as a site with no name.
	it( 'falls back to sample text when the site data is missing', () => {
		site = null;
		renderField();
		expand();
		expect( previews() ).toContainEqual( expect.stringMatching( /Hello World - Your site/ ) );
	} );

	it( 'shows all saved formats read-only while title output is conflicted', () => {
		const formats: Record< string, TitleFormatToken[] > = {
			front_page: [ { type: 'string', value: 'Front value' } ],
			posts: [ { type: 'string', value: 'Post value' } ],
			pages: [ { type: 'string', value: 'Page value' } ],
			groups: [ { type: 'string', value: 'Tag value' } ],
			archives: [ { type: 'string', value: 'Archive value' } ],
		};

		render(
			<TitleStructureField
				formats={ formats }
				onChange={ jest.fn() }
				onSaveFormat={ jest.fn() }
				isFormatDirty={ () => true }
				titleSeparator="-"
				editable={ false }
			/>
		);
		expand();

		expect(
			screen.getAllByText( /Another SEO plugin is controlling title output/ )
		).not.toHaveLength( 0 );
		expect( screen.getByRole( 'textbox', { name: 'Front page' } ) ).toHaveValue( 'Front value' );
		expect( screen.getByRole( 'textbox', { name: 'Posts' } ) ).toHaveValue( 'Post value' );
		expect( screen.getByRole( 'textbox', { name: 'Pages' } ) ).toHaveValue( 'Page value' );
		expect( screen.getByRole( 'textbox', { name: 'Tags' } ) ).toHaveValue( 'Tag value' );
		expect( screen.getByRole( 'textbox', { name: 'Archives' } ) ).toHaveValue( 'Archive value' );
		screen.getAllByRole( 'textbox' ).forEach( input => expect( input ).toBeDisabled() );
		screen
			.getAllByRole( 'button', { name: 'Save' } )
			.forEach( button => expect( button ).toHaveAttribute( 'aria-disabled', 'true' ) );
	} );
} );
