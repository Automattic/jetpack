import { render, screen } from '@testing-library/react';
import { useBlockEditingMode } from '@wordpress/block-editor';
import MapEdit from '../edit';

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	getBlockIconComponent: () => () => null,
} ) );
jest.mock( '@wordpress/block-editor', () => ( {
	BlockControls: ( { children } ) => children,
	InspectorControls: ( { children } ) => children,
	useBlockProps: () => ( {} ),
	useBlockEditingMode: jest.fn(),
	store: 'core/block-editor',
} ) );
jest.mock( '@wordpress/components', () => ( {
	withNotices: component => component,
	ResizableBox: jest.fn( ( { children, showHandle, enable } ) => (
		<div
			data-testid="resizable-box"
			data-show-handle={ String( showHandle ) }
			data-enabled={ String( enable !== false ) }
		>
			{ children }
		</div>
	) ),
	Placeholder: ( { children } ) => children,
	Spinner: () => null,
} ) );
jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { toggleSelection: () => {} } ),
	useSelect: () => ( { isPreviewMode: false } ),
} ) );
jest.mock( '@wordpress/ui', () => ( {} ) );
jest.mock( '../utils/get-map-provider', () => () => 'mapkit' );
jest.mock( '../add-point', () => jest.fn( () => null ) );
jest.mock( '../component', () => ( {
	__esModule: true,
	default: require( '@wordpress/element' ).forwardRef( () => null ),
} ) );
jest.mock( '../controls', () => jest.fn( () => null ) );

describe( 'Map Block - Write Mode (contentOnly)', () => {
	const defaultProps = {
		attributes: { points: [] },
		setAttributes: jest.fn(),
		noticeOperations: { removeAllNotices: jest.fn(), createErrorNotice: jest.fn() },
		isSelected: true,
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it.each( [ 'contentOnly', 'disabled' ] )(
		'disables resize handles and resizing when blockEditingMode is %s',
		mode => {
			useBlockEditingMode.mockReturnValue( mode );

			render( <MapEdit { ...defaultProps } /> );

			const resizable = screen.getByTestId( 'resizable-box' );
			expect( resizable ).toHaveAttribute( 'data-show-handle', 'false' );
			expect( resizable ).toHaveAttribute( 'data-enabled', 'false' );
		}
	);

	it( 'enables resize handles and resizing when blockEditingMode is default', () => {
		useBlockEditingMode.mockReturnValue( 'default' );

		render( <MapEdit { ...defaultProps } /> );

		const resizable = screen.getByTestId( 'resizable-box' );
		expect( resizable ).toHaveAttribute( 'data-show-handle', 'true' );
		expect( resizable ).toHaveAttribute( 'data-enabled', 'true' );
	} );
} );
