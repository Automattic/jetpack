/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import { RecordCount } from 'components/record-meter/record-count';

describe( 'record count', () => {
	test( 'outputs correct text', () => {
		render( <RecordCount recordCount={ 20 } planRecordLimit={ 100 } /> );

		expect(
			screen.getByText( '20 records indexed out of the 100 allotted for your current plan' )
		).toBeInTheDocument();
	} );

	test( "doesn't output if there are no records", () => {
		render( <RecordCount /> );

		const recordCount = screen.queryByTestId( 'record-count' );
		expect( recordCount ).not.toBeInTheDocument();
	} );
} );
