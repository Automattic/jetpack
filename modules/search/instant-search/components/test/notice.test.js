/** @jsx h
 * @jest-environment jsdom
 */
/* global expect */

/**
 * External dependencies
 */
import { h } from 'preact';
import { render } from '@testing-library/preact';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import Notice from '../notice';

test( 'returns a notice if the type is warning', () => {
	const { asFragment } = render( <Notice type="warning" /> );
	expect( asFragment() ).toMatchSnapshot();
} );
