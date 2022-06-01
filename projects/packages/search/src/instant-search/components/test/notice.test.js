/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Notice from '../notice';

test( 'returns a notice if the type is warning', () => {
	const { asFragment } = render( <Notice type="warning" /> );
	expect( asFragment() ).toMatchSnapshot();
} );
