import { render, screen } from '@testing-library/react';
import { entityHeaderActions } from './header-actions';
import type { EntityRecordSummary } from './use-entity-summary';

const SUMMARY: EntityRecordSummary = {
	isLoading: false,
	isError: false,
	error: null,
	isNotFound: false,
	refetch: () => {},
};

describe( 'entityHeaderActions', () => {
	it( 'links to the entity, in a new tab', () => {
		render( <>{ entityHeaderActions( { ...SUMMARY, url: 'https://example.com/about-us/' } ) }</> );

		const link = screen.getByRole( 'link', { name: /View/ } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/about-us/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );

	it.each( [
		[ 'no link', undefined ],
		// The record comes from an endpoint anyone may have written.
		[ 'a link that is not http(s)', 'javascript:alert(1)' ],
	] )( 'offers nothing for a record with %s', ( _name, url ) => {
		expect( entityHeaderActions( { ...SUMMARY, url } ) ).toBeNull();
	} );
} );
