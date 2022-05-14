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
import RecordMeter from 'components/record-meter';

jest.mock( 'components/record-meter/bar-chart', () => ( {
	BarChart: () => null,
} ) );

describe( 'load the app', () => {
	test( 'container renders', () => {
		render( <RecordMeter /> );

		const container = screen.queryByTestId( 'record-meter' );
		expect( container ).toBeInTheDocument();
	} );
} );
