import { render, screen } from '@testing-library/react';
import { getUtmFields } from './fields';
import type { UtmReportRow } from './aggregate';
import type { ReactNode } from 'react';

// The router is built dynamically at runtime, so a field-level test has no
// router to mount. Render `Link` as the anchor it becomes, keeping `to`/`params`
// assertable.
jest.mock( '@wordpress/route', () => ( {
	Link: ( {
		to,
		params,
		children,
	}: {
		to: string;
		params: Record< string, string >;
		children: ReactNode;
	} ) => <a href={ to.replace( /\$(\w+)/g, ( _match, key ) => params[ key ] ) }>{ children }</a>,
} ) );

const row: UtmReportRow = {
	id: 'post-41',
	parentId: 'utm-newsletter',
	label: 'Landing page',
	groupLabel: 'newsletter / email',
	postId: 41,
	views: 1234,
	previousViews: 1000,
};

describe( 'UTM report fields', () => {
	it( 'makes UTM and post values searchable', () => {
		const field = getUtmFields( 'source-medium' ).find( candidate => candidate.id === 'utmValue' );

		expect( field?.enableGlobalSearch ).toBe( true );
		expect( field?.getValue?.( { item: row } as never ) ).toBe( 'Landing page' );
	} );

	it.each( [
		[ 'source-medium', 'Source / Medium' ],
		[ 'campaign-source-medium', 'Campaign / Source / Medium' ],
		[ 'source', 'Source' ],
		[ 'medium', 'Medium' ],
		[ 'campaign', 'Campaign' ],
	] as const )( 'labels the %s dimension column', ( tab, label ) => {
		const field = getUtmFields( tab ).find( candidate => candidate.id === 'utmValue' );

		expect( field?.label ).toBe( label );
	} );

	it( 'links nested posts to the post detail route', () => {
		const field = getUtmFields( 'source-medium' ).find( candidate => candidate.id === 'utmValue' );
		const { render: UtmField } = field ?? {};

		if ( ! field || ! UtmField ) {
			throw new Error( 'UTM field render callback is unavailable' );
		}

		render( <UtmField item={ row } field={ field as never } /> );

		const link = screen.getByRole( 'link', { name: row.label } );
		expect( link ).toHaveAttribute( 'href', '/post/41' );
		expect( link ).not.toHaveAttribute( 'target' );
		// eslint-disable-next-line testing-library/no-node-access -- An external-link icon would be an SVG inside the anchor.
		expect( link.querySelector( 'svg' ) ).not.toBeInTheDocument();
	} );

	it( 'renders posts without an id as plain text', () => {
		const field = getUtmFields( 'source-medium' ).find( candidate => candidate.id === 'utmValue' );
		const { render: UtmField } = field ?? {};
		const rowWithoutPostId = { ...row, postId: undefined };

		if ( ! field || ! UtmField ) {
			throw new Error( 'UTM field render callback is unavailable' );
		}

		render( <UtmField item={ rowWithoutPostId } field={ field as never } /> );

		expect( screen.getByText( rowWithoutPostId.label ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps title-field styling on UTM parent rows', () => {
		const field = getUtmFields( 'source-medium' ).find( candidate => candidate.id === 'utmValue' );
		const { render: UtmField } = field ?? {};
		const parentRow: UtmReportRow = {
			id: 'utm-newsletter',
			label: 'newsletter / email',
			views: 1500,
			isGroup: true,
		};

		if ( ! field || ! UtmField ) {
			throw new Error( 'UTM field render callback is unavailable' );
		}

		render( <UtmField item={ parentRow } field={ field as never } /> );

		expect( screen.getByText( parentRow.label ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'announces the parent UTM value on nested post rows', () => {
		const field = getUtmFields( 'source-medium' ).find( candidate => candidate.id === 'utmValue' );
		const { render: UtmField } = field ?? {};

		if ( ! field || ! UtmField ) {
			throw new Error( 'UTM field render callback is unavailable' );
		}

		render( <UtmField item={ row } field={ field as never } /> );

		expect( screen.getByText( `${ row.groupLabel }:` ) ).toBeInTheDocument();
	} );

	it( 'renders a localized view count and comparison delta', () => {
		const field = getUtmFields( 'source-medium' ).find( candidate => candidate.id === 'views' );
		const { render: ViewsField } = field ?? {};

		if ( ! field || ! ViewsField ) {
			throw new Error( 'Views field render callback is unavailable' );
		}

		render( <ViewsField item={ row } field={ field as never } /> );

		expect( screen.getByText( row.views.toLocaleString() ) ).toBeInTheDocument();
		expect( screen.getByText( '+23%' ) ).toBeInTheDocument();
	} );
} );
