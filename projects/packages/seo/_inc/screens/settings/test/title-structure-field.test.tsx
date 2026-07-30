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
			expect( screen.getByText( /Hello World - Acme Co/ ) ).toBeInTheDocument();
			expect( screen.getByText( /Acme Co - We make things/ ) ).toBeInTheDocument();
		} );

		it( 'marks an untouched field as using the default', () => {
			renderField();
			expand();
			expect( screen.getByRole( 'textbox', { name: 'Posts' } ) ).toHaveAttribute(
				'placeholder',
				'Using the default title'
			);
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
			expect( screen.getByText( /Hello World \| Acme Co/ ) ).toBeInTheDocument();
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
			expect( screen.getByText( /^\s*Acme Co\s*$/ ) ).toBeInTheDocument();
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
			expect( screen.getByText( /^\s*Acme Co -\s*$/ ) ).toBeInTheDocument();
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
		expect( screen.getByText( /Hello World - Your site/ ) ).toBeInTheDocument();
	} );
} );
