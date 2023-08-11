/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { RecordCount } from 'components/record-meter/record-count';
import React from 'react';

describe( 'record count', () => {
	test( 'outputs correct record counts', () => {
		render( <RecordCount recordCount={ 20 } tierMaximumRecords={ 100 } /> );

		expect( screen.getByText( /20/i ) ).toBeInTheDocument();

		expect( screen.getByText( /records indexed/i ) ).toBeInTheDocument();

		expect( screen.getByText( /100/i ) ).toBeInTheDocument();
	} );

	test( "doesn't output if there are no records", () => {
		render( <RecordCount /> );

		const recordCount = screen.queryByTestId( 'record-count' );
		expect( recordCount ).not.toBeInTheDocument();
	} );
} );
