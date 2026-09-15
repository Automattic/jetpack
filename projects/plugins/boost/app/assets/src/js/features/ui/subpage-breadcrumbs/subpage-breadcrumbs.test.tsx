/* No jest-dom or user-event in this project. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute, testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import SubpageBreadcrumbs from './subpage-breadcrumbs';

jest.mock( '$lib/navigation/navigation-context', () => ( {
	useBoostNavigation: () => ( { returnToSettings: mockReturn, settingsHref: '/settings-href' } ),
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );

const mockReturn = jest.fn();

describe( 'SubpageBreadcrumbs', () => {
	beforeEach( () => jest.clearAllMocks() );

	it( 'links Boost to Settings and names the current page', () => {
		render( <SubpageBreadcrumbs current="Cache debug log" /> );

		expect( screen.getByRole( 'navigation', { name: 'Breadcrumbs' } ) ).toBeTruthy();
		expect( screen.getByRole( 'link', { name: 'Boost' } ).getAttribute( 'href' ) ).toBe(
			'/settings-href'
		);
		expect( screen.getByText( 'Cache debug log' ) ).toBeTruthy();
	} );

	it( 'returns to Settings in place and records the click', () => {
		const { recordBoostEvent } = jest.requireMock( '$lib/utils/analytics' );
		render( <SubpageBreadcrumbs current="Cache debug log" /> );

		const prevented = ! fireEvent.click( screen.getByRole( 'link', { name: 'Boost' } ) );

		expect( prevented ).toBe( true );
		expect( mockReturn ).toHaveBeenCalledTimes( 1 );
		expect( recordBoostEvent ).toHaveBeenCalledWith(
			'back_button_clicked',
			expect.objectContaining( { destination: '/' } )
		);
	} );
} );
