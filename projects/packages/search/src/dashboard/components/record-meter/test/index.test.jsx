/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import RecordMeter from 'components/record-meter';
import React from 'react';

describe( 'load the app', () => {
	test( 'container renders', () => {
		render( <RecordMeter /> );

		expect( screen.getByTestId( 'record-meter' ) ).toBeInTheDocument();
	} );
} );
