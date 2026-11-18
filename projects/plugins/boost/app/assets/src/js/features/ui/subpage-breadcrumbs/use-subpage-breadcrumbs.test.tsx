/* No jest-dom or user-event in this project. */
/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useSubpageBreadcrumbs } from './use-subpage-breadcrumbs';

jest.mock( '$lib/navigation/navigation-context', () => ( {
	useBoostNavigation: () => ( { returnToSettings: mockReturn, settingsHref: '/settings-href' } ),
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );

const mockReturn = jest.fn();

describe( 'useSubpageBreadcrumbs', () => {
	beforeEach( () => jest.clearAllMocks() );

	it( 'links Boost to Settings and names the current page', () => {
		const { result } = renderHook( () => useSubpageBreadcrumbs( 'Cache debug log' ) );

		expect( result.current.breadcrumbs ).toEqual( [
			{ label: 'Boost', href: '/settings-href' },
			{ label: 'Cache debug log' },
		] );
	} );

	it( 'returns to Settings without a reload and records the click', () => {
		const { recordBoostEvent } = jest.requireMock( '$lib/utils/analytics' );
		const { result } = renderHook( () => useSubpageBreadcrumbs( 'Cache debug log' ) );
		const Link = result.current.components!.link!;
		render( <Link href="/settings-href">Boost</Link> );

		const prevented = ! fireEvent.click( screen.getByRole( 'link', { name: 'Boost' } ) );

		expect( prevented ).toBe( true );
		expect( mockReturn ).toHaveBeenCalledTimes( 1 );
		expect( recordBoostEvent ).toHaveBeenCalledWith(
			'back_button_clicked',
			expect.objectContaining( { destination: '/', source: 'breadcrumb' } )
		);
	} );
} );
