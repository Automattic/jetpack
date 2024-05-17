import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import ZendeskChat from '../index';

describe( 'ZendeskChat', () => {
	afterEach( () => {
		// restore the spy created with spyOn
		jest.restoreAllMocks();
	} );

	it( 'renders the zendesk chat widget', () => {
		render( <ZendeskChat jwt_token="exampletoken" /> );

		expect( screen.getByTestId( 'zendesk-chat-container' ) ).toBeInTheDocument();
	} );
} );
