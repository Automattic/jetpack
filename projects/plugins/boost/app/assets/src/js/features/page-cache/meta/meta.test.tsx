/* No jest-dom or user-event in this project. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute, testing-library/prefer-user-event, testing-library/no-node-access */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ModuleSurfaceProvider } from '$features/module/surface';
import Meta from './meta';

jest.mock( '$lib/stores/page-cache', () => ( {
	usePageCache: () => ( {} ),
	useClearPageCacheAction: () => [ '', { mutate: jest.fn() } ],
} ) );
jest.mock( '@automattic/jetpack-react-data-sync-client', () => ( {
	useDataSyncSubset: ( _store: unknown, key: string ) => [
		key === 'logging' ? false : [],
		{ mutate: jest.fn() },
	],
} ) );
jest.mock( '$features/ui', () => ( { useMutationNotice: jest.fn() } ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );

describe( 'Page Cache example tooltip', () => {
	it.each( [ false, true ] )( 'opens with Space and dismisses with Escape (row: %s)', row => {
		render(
			row ? (
				<ModuleSurfaceProvider value="row">
					<Meta />
				</ModuleSurfaceProvider>
			) : (
				<Meta />
			)
		);
		fireEvent.click( screen.getByRole( 'button', { name: row ? 'Except None' : 'Show Options' } ) );
		const trigger = screen.getByRole( 'button', { name: 'See an example' } );
		trigger.focus();
		fireEvent.keyDown( trigger, { key: ' ' } );
		expect( screen.getByText( 'Example:' ) ).toBeTruthy();
		expect( trigger.getAttribute( 'aria-expanded' ) ).toBe( 'true' );
		fireEvent.keyDown( screen.getByText( 'Example:' ), { key: 'Escape' } );
		expect( screen.queryByText( 'Example:' ) ).toBeNull();
		expect( trigger.ownerDocument.activeElement ).toBe( trigger );
		expect( trigger.getAttribute( 'aria-expanded' ) ).toBe( 'false' );
	} );

	it.each( [ false, true ] )( 'keeps a held example open across a rerender (row: %s)', row => {
		jest.useFakeTimers();
		try {
			const content = row ? (
				<ModuleSurfaceProvider value="row">
					<Meta />
				</ModuleSurfaceProvider>
			) : (
				<Meta />
			);
			const { rerender } = render( content );
			fireEvent.click(
				screen.getByRole( 'button', { name: row ? 'Except None' : 'Show Options' } )
			);
			const trigger = screen.getByRole( 'button', { name: 'See an example' } );
			fireEvent.click( trigger );
			fireEvent.mouseDown( trigger );
			rerender(
				row ? (
					<ModuleSurfaceProvider value="row">
						<Meta />
					</ModuleSurfaceProvider>
				) : (
					<Meta />
				)
			);
			act( () => trigger.focus() );
			act( () => jest.advanceTimersByTime( 100 ) );
			expect( screen.getByText( 'Example:' ) ).toBeTruthy();
			fireEvent.mouseUp( trigger );
			fireEvent.click( trigger );
			expect( screen.queryByText( 'Example:' ) ).toBeNull();
			expect( trigger.getAttribute( 'aria-expanded' ) ).toBe( 'false' );
		} finally {
			jest.useRealTimers();
		}
	} );
} );
