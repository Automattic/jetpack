import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddVideosDialog from '../add-videos-dialog';
import type { LibraryItem } from '../../../types/library';
import type { View } from '@wordpress/dataviews';

const PAGES: Record< number, Partial< LibraryItem >[] > = {
	1: [
		{ id: '1', guid: 'aaaaaaa1', title: 'One', durationSeconds: 10 },
		{ id: '2', guid: '', title: 'Not on VideoPress', durationSeconds: 5 },
	],
	2: [ { id: '3', guid: 'ccccccc3', title: 'Three', durationSeconds: 30 } ],
};

const mockUseLibrary = jest.fn( ( view: View ) => ( {
	items: PAGES[ view.page ?? 1 ] ?? [],
	isLoading: false,
	paginationInfo: { totalItems: 3, totalPages: 2 },
} ) );

jest.mock( '../../../hooks/use-library', () => ( {
	useLibrary: ( view: View ) => mockUseLibrary( view ),
} ) );
jest.mock( '../../../hooks/use-poster-url', () => ( { usePosterUrl: () => '' } ) );

// A minimal picker: lists items, toggles selection, pages, and runs the primary action.
jest.mock( '@wordpress/dataviews', () => ( {
	DataViewsPicker: ( {
		data,
		view,
		onChangeView,
		actions,
		selection,
		onChangeSelection,
	}: {
		data: LibraryItem[];
		view: View;
		onChangeView: ( v: View ) => void;
		actions: Array< { id: string; label: string; callback: () => void } >;
		selection: string[];
		onChangeSelection: ( s: string[] ) => void;
	} ) => (
		<div>
			{ data.map( item => (
				<button key={ item.id } onClick={ () => onChangeSelection( [ ...selection, item.id ] ) }>
					{ item.title }
				</button>
			) ) }
			<button onClick={ () => onChangeView( { ...view, page: ( view.page ?? 1 ) + 1 } ) }>
				Next page
			</button>
			{ actions.map( action => (
				<button key={ action.id } onClick={ action.callback }>
					{ action.label }
				</button>
			) ) }
		</div>
	),
} ) );

describe( 'AddVideosDialog', () => {
	it( 'only lists VideoPress videos and adds picks from every page in order', async () => {
		const user = userEvent.setup();
		const onAdd = jest.fn();
		render( <AddVideosDialog onAdd={ onAdd } onClose={ jest.fn() } /> );

		expect( screen.queryByRole( 'button', { name: 'Not on VideoPress' } ) ).not.toBeInTheDocument();
		expect( mockUseLibrary ).toHaveBeenLastCalledWith(
			expect.objectContaining( {
				filters: [ { field: 'type', operator: 'is', value: 'videopress' } ],
			} )
		);
		expect( screen.getByRole( 'button', { name: 'Add videos' } ) ).toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'One' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Next page' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Three' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Add 2 videos' } ) );

		expect( onAdd ).toHaveBeenCalledWith( [
			expect.objectContaining( { guid: 'aaaaaaa1' } ),
			expect.objectContaining( { guid: 'ccccccc3' } ),
		] );
	} );

	it( 'closes from its close button', async () => {
		const onClose = jest.fn();
		render( <AddVideosDialog onAdd={ jest.fn() } onClose={ onClose } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Close' } ) );

		expect( onClose ).toHaveBeenCalled();
	} );
} );
