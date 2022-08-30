/**
 * @jest-environment jsdom
 */

import { render } from '@testing-library/react';
import React from 'react';
import Notice from '../notice';

test( 'returns a notice if the type is warning', () => {
	const { asFragment } = render( <Notice type="warning" /> );
	expect( asFragment() ).toMatchSnapshot( '<Notice> output' );
} );
