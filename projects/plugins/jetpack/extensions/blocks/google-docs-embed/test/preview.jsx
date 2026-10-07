import { render, screen } from '@testing-library/react';
import Preview from '../preview';

describe( 'google-docs-embed Preview', () => {
	test( 'renders an iframe for an allowed Google HTTPS url', () => {
		render( <Preview url="https://docs.google.com/document/d/abc123/preview" title="Doc" /> );

		expect( screen.getByTitle( 'Doc' ) ).toBeInTheDocument();
	} );

	test.each( [
		'javascript:void(0)',
		'data:text/html,<p>hello</p>',
		'https://other.example.com/document/d/abc123/preview',
		'http://docs.google.com/document/d/abc123/preview',
	] )( 'does not mount an iframe for a url that is not allowed: %s', url => {
		render( <Preview url={ url } title="Doc" /> );

		expect( screen.queryByTitle( 'Doc' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'This embed URL is not supported.' ) ).toBeInTheDocument();
	} );
} );
