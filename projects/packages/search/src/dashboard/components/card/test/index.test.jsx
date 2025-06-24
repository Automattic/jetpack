/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import Card from 'components/card';

describe( 'Card', function () {
	it( 'can render', () => {
		render( <Card title="Title" /> );
		expect( screen.getByRole( 'heading' ) ).toBeInTheDocument();
	} );
} );
