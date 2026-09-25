import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { getMockRouteLinkUrl, setMockRouteSearch } from '../../../../tests/js/route-test-utils';
import { getEmailsFields } from './fields';
import type { StatsEmailSummaryItem } from '@jetpack-premium-analytics/data';

jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual( '../../../../tests/js/route-test-utils' );

	return mockWordPressRoute;
} );

setMockRouteSearch( {
	from: '2026-06-01',
	to: '2026-06-16',
	interval: 'day',
	foreign: 'drop-me',
} );

const email: StatsEmailSummaryItem = {
	id: 91,
	label: 'Weekly update',
	value: 120,
	date: '2026-07-10',
	opens: 120,
	clicks: 14,
	opens_rate: 38.1,
	clicks_rate: 3.81,
	unique_opens: 98,
	unique_clicks: 11,
	total_sends: 250,
	children: null,
};

describe( 'emails fields', () => {
	it( 'links an email to its detail tab with the date window and report origin', () => {
		const field = getEmailsFields().find( candidate => candidate.id === 'label' );

		if ( ! field || ! field.render ) {
			throw new Error( 'Emails title field render callback is unavailable' );
		}

		render( createElement( field.render, { item: email, field: field as never } ) );

		const link = screen.getByRole( 'link', { name: 'Weekly update' } );
		const url = getMockRouteLinkUrl( link );
		expect( url.pathname ).toBe( '/post/91' );
		expect( Object.fromEntries( url.searchParams ) ).toEqual( {
			from: '2026-06-01',
			to: '2026-06-16',
			interval: 'day',
			ref: 'emails',
			section: 'email-opens',
		} );
	} );

	it( 'sorts an unknown open rate after a real 0% in either direction', () => {
		const field = getEmailsFields().find( candidate => candidate.id === 'opens_rate' );

		if ( ! field?.getValue || ! field.sort ) {
			throw new Error( 'Open rate field is missing its getValue or sort' );
		}

		const unopened = { ...email, id: 1, opens: 0, unique_opens: 0, opens_rate: 0, total_sends: 1 };
		const legacy = { ...email, id: 2, opens: 120, unique_opens: 0, opens_rate: 0, total_sends: 0 };
		const rates = [ legacy, unopened, email ].map( item => field.getValue!( { item } ) );

		expect( rates ).toEqual( [ undefined, 0, 38.1 ] );

		const order = ( direction: 'asc' | 'desc' ) =>
			[ ...rates ]
				.map( ( rate, index ) => ( { rate, index } ) )
				.sort( ( a, b ) => field.sort!( a.rate as never, b.rate as never, direction ) )
				.map( ( { index } ) => [ 'legacy', 'unopened', 'email' ][ index ] );

		expect( order( 'asc' ) ).toEqual( [ 'unopened', 'email', 'legacy' ] );
		expect( order( 'desc' ) ).toEqual( [ 'email', 'unopened', 'legacy' ] );
	} );
} );
