import { render } from '@testing-library/react';
import React from 'react';
import MarkdownRenderer from '../renderer';
import { source } from './fixtures/source';

describe( 'MarkdownRenderer', () => {
	test( 'renders markdown to HTML as expected', () => {
		const { container } = render( <MarkdownRenderer className="markdown" source={ source } /> );
		expect( container ).toMatchSnapshot( 'source' );
	} );
} );
