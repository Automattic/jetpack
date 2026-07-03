import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useYouTubeVideos } from '../../../hooks/use-youtube-videos';
import ImportPicker from '../picker';
import type { YouTubeVideo } from '../../../hooks/use-youtube-videos';
import type { Action, View } from '@wordpress/dataviews';

// The picker's DataViews wiring (selection, cursor pagination, actions) is
// what's under test — not DataViews itself. Replace it with a light fake
// that exposes checkboxes per row, a next-page button, and the pagination
// info, and capture the props for direct assertions on `actions`.
type FakeDataViewsProps = {
	data: YouTubeVideo[];
	getItemId: ( item: YouTubeVideo ) => string;
	selection: string[];
	onChangeSelection: ( ids: string[] ) => void;
	view: View;
	onChangeView: ( view: View ) => void;
	paginationInfo: { totalItems: number; totalPages: number };
	actions: Action< YouTubeVideo >[];
};

let lastDataViewsProps: FakeDataViewsProps;

jest.mock( '@wordpress/dataviews', () => ( {
	__esModule: true,
	DataViews: ( props: FakeDataViewsProps ) => {
		lastDataViewsProps = props;
		const { data, getItemId, selection, onChangeSelection, view, onChangeView, paginationInfo } =
			props;
		return (
			<div>
				<div data-testid="pagination">
					{ paginationInfo.totalItems }:{ paginationInfo.totalPages }
				</div>
				{ data.map( item => {
					const id = getItemId( item );
					const checked = selection.includes( id );
					return (
						<div key={ id }>
							<input
								type="checkbox"
								aria-label={ item.title }
								checked={ checked }
								onChange={ () =>
									onChangeSelection(
										checked ? selection.filter( s => s !== id ) : [ ...selection, id ]
									)
								}
							/>
							<span>{ item.title }</span>
						</div>
					);
				} ) }
				<button onClick={ () => onChangeView( { ...view, page: ( view.page ?? 1 ) + 1 } ) }>
					next-page
				</button>
			</div>
		);
	},
} ) );

jest.mock( '../../../hooks/use-youtube-videos', () => ( {
	__esModule: true,
	...jest.requireActual( '../../../hooks/use-youtube-videos' ),
	useYouTubeVideos: jest.fn(),
} ) );

const mockUseYouTubeVideos = useYouTubeVideos as jest.Mock;

const makeVideo = ( index: number, overrides: Partial< YouTubeVideo > = {} ): YouTubeVideo => ( {
	externalId: `yt-${ index }`,
	title: `Video ${ index }`,
	description: '',
	tags: [],
	durationSeconds: 60 + index,
	privacy: 'public',
	publishedAt: '2026-01-01T00:00:00Z',
	thumbnailUrl: `https://example.com/${ index }.jpg`,
	alreadyImported: false,
	attachmentId: null,
	...overrides,
} );

const makeVideos = ( count: number ) =>
	Array.from( { length: count }, ( _, index ) => makeVideo( index + 1 ) );

const mockVideos = (
	videos: YouTubeVideo[],
	overrides: Partial< ReturnType< typeof useYouTubeVideos > > = {}
) => {
	mockUseYouTubeVideos.mockReturnValue( {
		videos,
		fetchNextPage: jest.fn(),
		hasNextPage: false,
		isFetchingNextPage: false,
		isLoading: false,
		isError: false,
		error: null,
		refetch: jest.fn(),
		...overrides,
	} );
};

describe( 'ImportPicker', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	const setupPicker = ( onImport = jest.fn(), isStarting = false ) => {
		render(
			<ImportPicker accountName="My Channel" onImport={ onImport } isStarting={ isStarting } />
		);
		return onImport;
	};

	it( 'renders the listing with the connected account name', () => {
		mockVideos( makeVideos( 2 ) );
		setupPicker();

		expect( screen.getByText( 'Importing from My Channel' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Video 1' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Video 2' ) ).toBeInTheDocument();
	} );

	it( 'disables the import button at zero selection and labels it by count', async () => {
		mockVideos( makeVideos( 3 ) );
		setupPicker();

		// The @wordpress/ui Button disables via aria-disabled (it stays
		// focusable), so jest-dom's toBeDisabled() doesn't apply.
		expect( screen.getByRole( 'button', { name: 'Import videos' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Video 1' } ) );
		expect( screen.getByRole( 'button', { name: 'Import 1 video' } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Video 3' } ) );
		expect( screen.getByRole( 'button', { name: 'Import 2 videos' } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'imports the selected videos on click', async () => {
		const videos = makeVideos( 3 );
		mockVideos( videos );
		const onImport = setupPicker();

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Video 2' } ) );
		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Video 3' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Import 2 videos' } ) );

		expect( onImport ).toHaveBeenCalledWith( [ videos[ 1 ], videos[ 2 ] ] );
	} );

	it( 'excludes already-imported videos from the selection count and payload', async () => {
		const videos = [ makeVideo( 1, { alreadyImported: true, attachmentId: 9 } ), makeVideo( 2 ) ];
		mockVideos( videos );
		const onImport = setupPicker();

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Video 1' } ) );
		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Video 2' } ) );

		const button = screen.getByRole( 'button', { name: 'Import 1 video' } );
		await userEvent.click( button );

		expect( onImport ).toHaveBeenCalledWith( [ videos[ 1 ] ] );
	} );

	it( 'disables the import button while the POST is in flight', async () => {
		mockVideos( makeVideos( 1 ) );
		setupPicker( jest.fn(), true );

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Video 1' } ) );
		expect( screen.getByRole( 'button', { name: 'Import 1 video' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'advertises one extra item and page while the cursor has more', () => {
		mockVideos( makeVideos( 20 ), { hasNextPage: true } );
		setupPicker();

		expect( screen.getByTestId( 'pagination' ) ).toHaveTextContent( '21:2' );
	} );

	it( 'reports exact totals once the cursor runs out', () => {
		mockVideos( makeVideos( 5 ) );
		setupPicker();

		expect( screen.getByTestId( 'pagination' ) ).toHaveTextContent( '5:1' );
	} );

	it( 'fetches the next server page when the view asks for unloaded rows', async () => {
		const fetchNextPage = jest.fn();
		mockVideos( makeVideos( 20 ), { hasNextPage: true, fetchNextPage } );
		setupPicker();

		expect( fetchNextPage ).not.toHaveBeenCalled();

		await userEvent.click( screen.getByRole( 'button', { name: 'next-page' } ) );

		expect( fetchNextPage ).toHaveBeenCalled();
	} );

	it( 'exposes a bulk import action that skips already-imported rows', () => {
		const videos = [ makeVideo( 1 ), makeVideo( 2, { alreadyImported: true } ) ];
		mockVideos( videos );
		const onImport = setupPicker();

		const action = lastDataViewsProps.actions[ 0 ];
		expect( action.id ).toBe( 'import' );
		expect( action.supportsBulk ).toBe( true );
		expect( action.isEligible?.( videos[ 0 ] ) ).toBe( true );
		expect( action.isEligible?.( videos[ 1 ] ) ).toBe( false );

		( action as Action< YouTubeVideo > & { callback: ( items: YouTubeVideo[] ) => void } ).callback(
			[ videos[ 0 ] ]
		);
		expect( onImport ).toHaveBeenCalledWith( [ videos[ 0 ] ] );
	} );
} );
