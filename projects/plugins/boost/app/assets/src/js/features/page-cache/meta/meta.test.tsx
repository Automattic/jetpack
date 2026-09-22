/* No jest-dom or user-event in this project. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute, testing-library/prefer-user-event, testing-library/no-node-access */
import { fireEvent, render, screen } from '@testing-library/react';
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

const renderMeta = ( row: boolean ) =>
	render(
		row ? (
			<ModuleSurfaceProvider value="row">
				<Meta />
			</ModuleSurfaceProvider>
		) : (
			<Meta />
		)
	);

describe( 'Page Cache example tooltip', () => {
	it.each( [ false, true ] )( 'opens from the trigger and closes with Escape (row: %s)', row => {
		renderMeta( row );
		// The exceptions live behind the Except panel on the modern surface, Show Options on the other.
		fireEvent.click( screen.getByRole( 'button', { name: row ? 'Except None' : 'Show Options' } ) );
		const trigger = screen.getByRole( 'button', { name: 'See an example' } );
		trigger.focus();
		fireEvent.click( trigger );
		expect( screen.getByText( 'Example:' ) ).toBeTruthy();
		expect( trigger.getAttribute( 'aria-expanded' ) ).toBe( 'true' );
		fireEvent.keyDown( screen.getByText( 'Example:' ), { key: 'Escape' } );
		expect( screen.queryByText( 'Example:' ) ).toBeNull();
		expect( trigger.ownerDocument.activeElement ).toBe( trigger );
		expect( trigger.getAttribute( 'aria-expanded' ) ).toBe( 'false' );
	} );
} );
