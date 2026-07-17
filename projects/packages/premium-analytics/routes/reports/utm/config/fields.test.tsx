import { render, screen } from '@testing-library/react';
import { getUtmFields } from './fields';
import type { UtmReportRow } from './aggregate';

const row: UtmReportRow = { id: 'newsletter', label: 'newsletter', views: 1234 };

describe( 'UTM report fields', () => {
	it( 'makes the UTM value searchable', () => {
		const field = getUtmFields( 'source-medium' ).find( candidate => candidate.id === 'utmValue' );

		expect( field?.enableGlobalSearch ).toBe( true );
		expect( field?.getValue?.( { item: row } as never ) ).toBe( 'newsletter' );
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

	it( 'renders a localized views value', () => {
		const field = getUtmFields( 'source-medium' ).find( candidate => candidate.id === 'views' );
		// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` here is the DataViews field render component, not RTL's render result.
		const ViewsField = field?.render;

		if ( ! field || ! ViewsField ) {
			throw new Error( 'Views field render callback is unavailable' );
		}

		render( <ViewsField item={ row } field={ field as never } /> );

		expect( screen.getByText( row.views.toLocaleString() ) ).toBeInTheDocument();
	} );
} );
