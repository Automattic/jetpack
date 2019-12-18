/**
 * @jsx h
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom/extend-expect';

import { h } from 'preact';
import { render } from '@testing-library/preact';

import Notice from '../notice';

test( 'returns a notice if the type is warning', () => {
	const { asFragment } = render( <Notice type="warning" /> );
	expect( asFragment() ).toMatchSnapshot();
} );
