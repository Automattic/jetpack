import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // Naya standard import
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import MapEdit from '../edit';

jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
	useSelect: jest.fn(),
} ) );

jest.mock( '@wordpress/blocks', () => ( {
	createBlock: jest.fn( () => ( { clientId: 'new-block-123', name: 'core/paragraph' } ) ),
	getDefaultBlockName: jest.fn( () => 'core/paragraph' ),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: jest.fn( props => ( { ...props, 'data-testid': 'map-block-wrapper' } ) ),
	store: 'core/block-editor',
	BlockControls: ( { children } ) => <div>{ children }</div>,
	InspectorControls: ( { children } ) => <div>{ children }</div>,
} ) );

jest.mock( './component', () => () => <div data-testid="mock-map"></div> );
jest.mock( './controls', () => () => <div></div> );

describe( 'Map Block - Edit Component', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'inserts a new default block when Enter key is pressed', async () => {
		const insertBlockMock = jest.fn();

		useDispatch.mockImplementation( storeName => {
			if ( storeName === 'core/block-editor' ) {
				return { toggleSelection: jest.fn(), insertBlock: insertBlockMock };
			}
			return {};
		} );

		useSelect.mockReturnValue( {
			isPreviewMode: false,
			blockIndex: 2,
		} );

		const attributes = { points: [] };
		const noticeOperations = { removeAllNotices: jest.fn() };

		render(
			<MapEdit
				attributes={ attributes }
				setAttributes={ jest.fn() }
				noticeOperations={ noticeOperations }
				clientId="test-client-id"
			/>
		);

		const blockWrapper = screen.getByTestId( 'map-block-wrapper' );

		await userEvent.type( blockWrapper, '{Enter}' );

		// Assertions
		expect( getDefaultBlockName ).toHaveBeenCalled();
		expect( createBlock ).toHaveBeenCalledWith( 'core/paragraph' );
		expect( insertBlockMock ).toHaveBeenCalledTimes( 1 );
		expect( insertBlockMock ).toHaveBeenCalledWith( expect.anything(), 3 );
	} );

	it( 'does not insert a block if Shift+Enter is pressed', async () => {
		const insertBlockMock = jest.fn();
		useDispatch.mockReturnValue( { insertBlock: insertBlockMock, toggleSelection: jest.fn() } );
		useSelect.mockReturnValue( { isPreviewMode: false, blockIndex: 2 } );

		render(
			<MapEdit
				attributes={ { points: [] } }
				setAttributes={ jest.fn() }
				noticeOperations={ { removeAllNotices: jest.fn() } }
				clientId="test-client-id"
			/>
		);

		const blockWrapper = screen.getByTestId( 'map-block-wrapper' );

		await userEvent.type( blockWrapper, '{Shift>}{Enter}{/Shift}' );

		expect( insertBlockMock ).not.toHaveBeenCalled();
	} );
} );
