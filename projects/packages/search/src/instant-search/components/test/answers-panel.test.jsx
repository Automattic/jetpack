import { render, screen } from '@testing-library/react';
import * as React from 'react';
import AnswersPanel from '../answers-panel';

describe( 'AnswersPanel', () => {
	it( 'renders nothing when idle', () => {
		const { container } = render( <AnswersPanel status="idle" text="" citations={ [] } /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing on error', () => {
		const { container } = render( <AnswersPanel status="error" text="" citations={ [] } /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'shows loading message', () => {
		render( <AnswersPanel status="loading" text="" citations={ [] } /> );
		expect( screen.getByText( 'Finding an answer…' ) ).toBeInTheDocument();
	} );

	it( 'shows streamed text', () => {
		render( <AnswersPanel status="streaming" text="Here is how to…" citations={ [] } /> );
		expect( screen.getByText( 'Here is how to…' ) ).toBeInTheDocument();
	} );

	it( 'shows full text and citations when done', () => {
		const citations = [ { title: 'Reset Password', url: '/reset', excerpt: '' } ];
		render( <AnswersPanel status="done" text="Reset here." citations={ citations } /> );
		expect( screen.getByText( 'Reset here.' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Reset Password' ) ).toBeInTheDocument();
	} );
} );
