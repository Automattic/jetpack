/* No jest-dom or user-event in this project. */
/* eslint-disable jest-dom/prefer-to-have-attribute, testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import BackToSettingsLink from './back-to-settings-link';

jest.mock( '$lib/navigation/navigation-context', () => ( {
	useBoostNavigation: () => ( { returnToSettings: mockReturn, settingsHref: '/settings-href' } ),
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );

const mockReturn = jest.fn();

describe( 'BackToSettingsLink', () => {
	beforeEach( () => jest.clearAllMocks() );

	it( 'links to Settings', () => {
		render( <BackToSettingsLink /> );

		expect( screen.getByRole( 'link', { name: 'Back to settings' } ).getAttribute( 'href' ) ).toBe(
			'/settings-href'
		);
	} );

	it( 'returns to Settings without a reload and records the click', () => {
		const { recordBoostEvent } = jest.requireMock( '$lib/utils/analytics' );
		render( <BackToSettingsLink /> );

		const prevented = ! fireEvent.click( screen.getByRole( 'link', { name: 'Back to settings' } ) );

		expect( prevented ).toBe( true );
		expect( mockReturn ).toHaveBeenCalledTimes( 1 );
		expect( recordBoostEvent ).toHaveBeenCalledWith(
			'back_button_clicked',
			expect.objectContaining( { destination: '/', source: 'back_link' } )
		);
	} );
} );
