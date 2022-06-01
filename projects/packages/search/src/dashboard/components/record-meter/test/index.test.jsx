/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import RecordMeter from 'components/record-meter';
import React from 'react';

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
