import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { addFilter } from '@wordpress/hooks';
import { registerOverlayWidgetAreaGuards } from '../../../src/search-blocks/editor/overlay-widget-area';

jest.mock( '@wordpress/hooks', () => ( { addFilter: jest.fn() } ) );

jest.mock( '@wordpress/block-editor', () => ( {
	store: { name: 'core/block-editor' },
	useBlockProps: () => ( {} ),
	Warning: ( { children, actions } ) => (
		<div role="alert">
			{ children }
			{ actions }
		</div>
	),
} ) );

jest.mock( '@wordpress/components', () => ( {
	Button: ( { children, onClick } ) => (
		<button type="button" onClick={ onClick }>
			{ children }
		</button>
	),
} ) );

jest.mock( '@wordpress/i18n', () => ( { __: text => text } ) );

const mockRemoveBlock = jest.fn();
let mockBlocks;

const mockBlockEditor = () => ( {
	getBlock: clientId => mockBlocks[ clientId ] ?? null,
	getBlockAttributes: clientId => mockBlocks[ clientId ]?.attributes ?? null,
	getBlockParents: clientId => mockBlocks[ clientId ]?.parents ?? [],
	getBlockParentsByBlockName: ( clientId, blockName ) =>
		( mockBlocks[ clientId ]?.parents ?? [] ).filter( id => mockBlocks[ id ].name === blockName ),
} );

jest.mock( '@wordpress/data', () => ( {
	useSelect: callback => callback( () => mockBlockEditor() ),
	useDispatch: () => ( { removeBlock: mockRemoveBlock } ),
} ) );

const OVERLAY_AREA = 'jetpack-instant-search-side-bar';
const SEARCH_BLOCK = { name: 'jetpack-search/filter-checkbox' };

const filterFor = hookName => addFilter.mock.calls.find( ( [ name ] ) => name === hookName )?.[ 2 ];

const widgetAreaBlocks = {
	overlay: { name: 'core/widget-area', attributes: { id: OVERLAY_AREA } },
	footer: { name: 'core/widget-area', attributes: { id: 'sidebar-1' } },
	overlayFilters: { name: 'jetpack-search/filters', attributes: {}, parents: [ 'overlay' ] },
	footerFilters: { name: 'jetpack-search/filters', attributes: {}, parents: [ 'footer' ] },
	overlaySearch: { name: 'jetpack-search/filter-checkbox', attributes: {}, parents: [ 'overlay' ] },
	footerSearch: { name: 'jetpack-search/filter-checkbox', attributes: {}, parents: [ 'footer' ] },
	overlayParagraph: { name: 'core/paragraph', attributes: {}, parents: [ 'overlay' ] },
};

beforeEach( () => {
	addFilter.mockClear();
	mockRemoveBlock.mockClear();
	mockBlocks = widgetAreaBlocks;
	registerOverlayWidgetAreaGuards( OVERLAY_AREA );
} );

afterEach( () => {
	delete window.wp;
} );

describe( 'inserter gate', () => {
	const canInsert = ( allowed, blockType, rootClientId ) =>
		filterFor( 'blockEditor.__unstableCanInsertBlockType' )(
			allowed,
			blockType,
			rootClientId,
			mockBlockEditor()
		);

	it( 'blocks Search blocks in the named widget area', () => {
		expect( canInsert( true, SEARCH_BLOCK, 'overlay' ) ).toBe( false );
	} );

	it( 'blocks Search blocks inside a container in the named widget area', () => {
		expect( canInsert( true, SEARCH_BLOCK, 'overlayFilters' ) ).toBe( false );
	} );

	it( 'allows Search blocks in other widget areas', () => {
		expect( canInsert( true, SEARCH_BLOCK, 'footer' ) ).toBe( true );
		expect( canInsert( true, SEARCH_BLOCK, 'footerFilters' ) ).toBe( true );
	} );

	it( 'allows other blocks in the named widget area', () => {
		expect( canInsert( true, { name: 'core/paragraph' }, 'overlay' ) ).toBe( true );
	} );

	it( 'never allows a block core already refused', () => {
		expect( canInsert( false, SEARCH_BLOCK, 'footer' ) ).toBe( false );
	} );

	it.each( [
		[ `sidebar-widgets-${ OVERLAY_AREA }`, false ],
		[ 'sidebar-widgets-sidebar-1', true ],
	] )(
		'in the Customizer, with section %s expanded, allows Search blocks: %s',
		( expanded, allowed ) => {
			window.wp = { customize: { section: id => ( { expanded: () => id === expanded } ) } };
			mockBlocks = { filters: { name: 'jetpack-search/filters', attributes: {} } };

			expect( canInsert( true, SEARCH_BLOCK, '' ) ).toBe( allowed );
			expect( canInsert( true, SEARCH_BLOCK, 'filters' ) ).toBe( allowed );
		}
	);
} );

describe( 'block warning', () => {
	const renderBlock = clientId => {
		const withWarning = filterFor( 'editor.BlockEdit' );
		const Edit = withWarning( () => <p>Block preview</p> );
		return render( <Edit name={ mockBlocks[ clientId ].name } clientId={ clientId } /> );
	};

	it( 'replaces a Search block in the named widget area with a warning', () => {
		renderBlock( 'overlaySearch' );

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( 'Jetpack Search Sidebar' );
		expect( screen.queryByText( 'Block preview' ) ).not.toBeInTheDocument();
	} );

	it( 'removes the block from the warning', async () => {
		renderBlock( 'overlaySearch' );

		await userEvent.click( screen.getByRole( 'button', { name: 'Remove block' } ) );

		expect( mockRemoveBlock ).toHaveBeenCalledWith( 'overlaySearch' );
	} );

	it( 'renders Search blocks in other widget areas', () => {
		renderBlock( 'footerSearch' );

		expect( screen.getByText( 'Block preview' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'alert' ) ).not.toBeInTheDocument();
	} );

	it( 'renders other blocks in the named widget area', () => {
		renderBlock( 'overlayParagraph' );

		expect( screen.getByText( 'Block preview' ) ).toBeInTheDocument();
	} );

	it.each( [
		[ [ 'block-9' ], true ],
		[ [ 'block-2' ], false ],
	] )( 'in the Customizer, with the area holding widgets %j, warns: %s', ( areaWidgets, warns ) => {
		window.wp = {
			customize: id =>
				id === `sidebars_widgets[${ OVERLAY_AREA }]` ? { get: () => areaWidgets } : undefined,
		};
		mockBlocks = {
			widget: {
				name: 'jetpack-search/filters',
				attributes: { __internalWidgetId: 'block-9' },
			},
			child: { name: 'jetpack-search/filter-checkbox', attributes: {}, parents: [ 'widget' ] },
		};

		renderBlock( 'child' );

		expect( screen.queryByRole( 'alert' ) !== null ).toBe( warns );
	} );
} );
