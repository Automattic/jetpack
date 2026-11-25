import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import MapEdit from '../edit';

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	getBlockIconComponent: () => () => null,
} ) );
jest.mock( '@wordpress/blocks', () => ( {
	createBlock: jest.fn( ( name, attrs ) => ( {
		clientId: 'new-block-123',
		name,
		attributes: attrs,
	} ) ),
	getDefaultBlockName: jest.fn( () => 'core/paragraph' ),
} ) );
jest.mock( '@wordpress/block-editor', () => ( {
	BlockControls: ( { children } ) => children,
	InspectorControls: ( { children } ) => children,
	useBlockProps: jest.fn( props => ( {
		...props,
		tabIndex: 0,
		'data-testid': 'map-block-wrapper',
	} ) ),
	store: 'core/block-editor',
} ) );
jest.mock( '@wordpress/components', () => ( {
	withNotices: component => component,
	ResizableBox: ( { children } ) => children,
	Placeholder: ( { children } ) => children,
	Spinner: () => null,
} ) );
jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
	useSelect: jest.fn(),
} ) );
jest.mock( '@wordpress/ui', () => ( {} ) );
jest.mock( '../utils/get-map-provider', () => () => 'mapkit' );
jest.mock( '../add-point', () => jest.fn( () => null ) );
jest.mock( '../component', () => ( {
	__esModule: true,
	default: require( '@wordpress/element' ).forwardRef( () => null ),
} ) );
jest.mock( '../controls', () => jest.fn( () => null ) );

describe( 'Map Block - Enter Key Handling', () => {
	const defaultProps = {
		attributes: { points: [] },
		setAttributes: jest.fn(),
		noticeOperations: { removeAllNotices: jest.fn(), createErrorNotice: jest.fn() },
		isSelected: true,
		clientId: 'map-client-id-1',
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'inserts a default block below when Enter key is pressed', async () => {
		const user = userEvent.setup();
		const insertAfterBlockMock = jest.fn();

		useDispatch.mockReturnValue( {
			toggleSelection: jest.fn(),
			insertAfterBlock: insertAfterBlockMock,
			insertBlock: jest.fn(),
		} );
		useSelect.mockReturnValue( {
			isPreviewMode: false,
			blockIndex: 3,
			rootClientId: 'root-id',
		} );

		render( <MapEdit { ...defaultProps } /> );

		const blockWrapper = screen.getByTestId( 'map-block-wrapper' );
		blockWrapper.focus();
		await user.keyboard( '{Enter}' );

		expect( insertAfterBlockMock ).toHaveBeenCalledWith( 'map-client-id-1' );
	} );

	it( 'falls back to insertBlock if insertAfterBlock is unavailable', async () => {
		const user = userEvent.setup();
		const insertBlockMock = jest.fn();

		useDispatch.mockReturnValue( {
			toggleSelection: jest.fn(),
			insertBlock: insertBlockMock,
		} );
		useSelect.mockReturnValue( {
			isPreviewMode: false,
			blockIndex: 3,
			rootClientId: 'root-id',
		} );

		render( <MapEdit { ...defaultProps } /> );

		const blockWrapper = screen.getByTestId( 'map-block-wrapper' );
		blockWrapper.focus();
		await user.keyboard( '{Enter}' );

		expect( getDefaultBlockName ).toHaveBeenCalled();
		expect( createBlock ).toHaveBeenCalledWith( 'core/paragraph' );
		expect( insertBlockMock ).toHaveBeenCalledWith(
			expect.objectContaining( { name: 'core/paragraph' } ),
			4,
			'root-id'
		);
	} );

	it( 'does not insert a block when modifier keys are pressed with Enter', async () => {
		const user = userEvent.setup();
		const insertAfterBlockMock = jest.fn();

		useDispatch.mockReturnValue( {
			toggleSelection: jest.fn(),
			insertAfterBlock: insertAfterBlockMock,
			insertBlock: jest.fn(),
		} );
		useSelect.mockReturnValue( {
			isPreviewMode: false,
			blockIndex: 3,
			rootClientId: 'root-id',
		} );

		render( <MapEdit { ...defaultProps } /> );

		const blockWrapper = screen.getByTestId( 'map-block-wrapper' );
		blockWrapper.focus();
		await user.keyboard( '{Shift>}{Enter}{/Shift}' );
		await user.keyboard( '{Control>}{Enter}{/Control}' );
		await user.keyboard( '{Alt>}{Enter}{/Alt}' );
		await user.keyboard( '{Meta>}{Enter}{/Meta}' );

		expect( insertAfterBlockMock ).not.toHaveBeenCalled();
	} );

	it( 'does not insert a block when Enter is pressed inside interactive elements or preview mode', async () => {
		const user = userEvent.setup();
		const insertAfterBlockMock = jest.fn();

		useDispatch.mockReturnValue( {
			toggleSelection: jest.fn(),
			insertAfterBlock: insertAfterBlockMock,
			insertBlock: jest.fn(),
		} );
		useSelect.mockReturnValue( {
			isPreviewMode: false,
			blockIndex: 3,
			rootClientId: 'root-id',
		} );

		const { rerender } = render( <MapEdit { ...defaultProps } /> );
		const blockWrapper = screen.getByTestId( 'map-block-wrapper' );

		const input = document.createElement( 'input' );
		const button = document.createElement( 'button' );
		const buttonChild = document.createElement( 'span' );
		buttonChild.tabIndex = 0;
		button.appendChild( buttonChild );
		blockWrapper.appendChild( input );
		blockWrapper.appendChild( button );

		input.focus();
		await user.keyboard( '{Enter}' );
		buttonChild.focus();
		await user.keyboard( '{Enter}' );
		expect( insertAfterBlockMock ).not.toHaveBeenCalled();

		useSelect.mockReturnValue( {
			isPreviewMode: true,
			blockIndex: 3,
			rootClientId: 'root-id',
		} );
		rerender( <MapEdit { ...defaultProps } /> );
		screen.getByTestId( 'map-block-wrapper' ).focus();
		await user.keyboard( '{Enter}' );
		expect( insertAfterBlockMock ).not.toHaveBeenCalled();
	} );
} );
