import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import ZendeskChat from '../index';
import utils from '../utils';

describe( 'ZendeskChat', () => {
	afterEach( () => {
		// restore the spy created with spyOn
		jest.restoreAllMocks();
	} );

	it( 'renders when Date and Time requirements are met', () => {
		// Mock conditions in which widget should be shown
		jest.spyOn( utils, 'isWithinAvailableChatTimes' ).mockReturnValue( true );
		jest.spyOn( utils, 'isWithinAvailableChatDays' ).mockReturnValue( true );

		render( <ZendeskChat /> );

		expect( screen.getByTestId( 'zendesk-chat-container' ) ).toBeInTheDocument();
	} );

	it( 'does not render when Time requirements are not met', () => {
		jest.spyOn( utils, 'isWithinAvailableChatTimes' ).mockReturnValue( false );
		jest.spyOn( utils, 'isWithinAvailableChatDays' ).mockReturnValue( true );

		render( <ZendeskChat /> );

		expect( screen.queryByTestId( 'zendesk-chat-container' ) ).not.toBeInTheDocument();
	} );

	it( 'does not render when Day requirements are not met', () => {
		jest.spyOn( utils, 'isWithinAvailableChatTimes' ).mockReturnValue( true );
		jest.spyOn( utils, 'isWithinAvailableChatDays' ).mockReturnValue( false );

		render( <ZendeskChat /> );

		expect( screen.queryByTestId( 'zendesk-chat-container' ) ).not.toBeInTheDocument();
	} );
} );
