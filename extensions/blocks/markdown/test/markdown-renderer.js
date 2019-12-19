/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import React from 'react';

/**
 * Internal dependencies
 */
import { source } from './fixtures/source'
import MarkdownRenderer from '../renderer';

describe( 'MarkdownRenderer', () => {
	test( 'renders markdown to HTML as expected', () => {
		expect( shallow( <MarkdownRenderer className='markdown' source={ source } /> ) ).toMatchSnapshot();
	} );
} );
