import { render, screen } from '@testing-library/react';
import * as React from 'react';
import AnswersPanel from '../answers-panel';

describe( 'AnswersPanel', () => {
	it( 'renders nothing when idle', () => {
		const { container } = render( <AnswersPanel status="idle" text="" citations={ [] } /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'shows loading message', () => {
		render( <AnswersPanel status="loading" text="" citations={ [] } /> );
		expect( screen.getByText( 'Finding an answer', { exact: false } ) ).toBeInTheDocument();
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

	describe( 'error state', () => {
		it( 'shows error message when error prop is null', () => {
			render( <AnswersPanel status="error" text="" citations={ [] } error={ null } /> );
			expect(
				screen.getByText( 'Sorry, an error occurred while generating an answer.' )
			).toBeInTheDocument();
		} );

		it( 'shows no detail line when error prop is null', () => {
			render( <AnswersPanel status="error" text="" citations={ [] } error={ null } /> );
			expect( screen.queryByTestId( 'answers-panel-error-detail' ) ).not.toBeInTheDocument();
		} );

		it( 'shows network error message', () => {
			const error = { message: 'Network request error', code: null, source: 'network' };
			render( <AnswersPanel status="error" text="" citations={ [] } error={ error } /> );
			expect( screen.getByText( 'Network request error' ) ).toBeInTheDocument();
		} );

		it( 'shows API error message', () => {
			const error = {
				message: 'An error occurred while processing the request. Please try again later.',
				code: -32000,
				source: 'api',
			};
			render( <AnswersPanel status="error" text="" citations={ [] } error={ error } /> );
			expect(
				screen.getByText( /An error occurred while processing the request/ )
			).toBeInTheDocument();
		} );

		it( 'shows "Error code: X" when code is present', () => {
			const error = { message: 'Request failed', code: -32000, source: 'api' };
			render( <AnswersPanel status="error" text="" citations={ [] } error={ error } /> );
			expect( screen.getByText( /Error code: -32000/ ) ).toBeInTheDocument();
		} );

		it( 'omits error code line when code is null', () => {
			const error = { message: 'Network request error', code: null, source: 'network' };
			render( <AnswersPanel status="error" text="" citations={ [] } error={ error } /> );
			expect( screen.queryByText( /Error code:/ ) ).not.toBeInTheDocument();
		} );

		it( 'shows HTTP friendly name as message', () => {
			const error = { message: 'Service Unavailable', code: 503, source: 'http' };
			render( <AnswersPanel status="error" text="" citations={ [] } error={ error } /> );
			expect( screen.getByText( /Service Unavailable/ ) ).toBeInTheDocument();
			expect( screen.getByText( /Error code: 503/ ) ).toBeInTheDocument();
		} );

		it( 'still shows the AI answer heading in error state', () => {
			render( <AnswersPanel status="error" text="" citations={ [] } /> );
			expect( screen.getByText( 'AI answer' ) ).toBeInTheDocument();
		} );
	} );
} );
