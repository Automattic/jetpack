import { render } from '@testing-library/react';
import MapEdit from '../edit';

const resizableBoxProps = [];

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	getBlockIconComponent: () => () => null,
} ) );
jest.mock( '@wordpress/block-editor', () => ( {
	BlockControls: ( { children } ) => children,
	InspectorControls: ( { children } ) => children,
	useBlockProps: () => ( {} ),
	store: 'core/block-editor',
} ) );
jest.mock( '@wordpress/components', () => ( {
	withNotices: component => component,
	ResizableBox: jest.fn( props => {
		resizableBoxProps.push( props );
		return <div>{ props.children }</div>;
	} ),
	Placeholder: ( { children } ) => children,
	Spinner: () => null,
} ) );
jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { toggleSelection: jest.fn() } ),
	useSelect: () => ( { isPreviewMode: false } ),
} ) );
jest.mock( '@wordpress/ui', () => ( {} ) );
jest.mock( '../utils/get-map-provider', () => () => 'mapkit' );
jest.mock( '../add-point', () => jest.fn( () => null ) );
jest.mock( '../controls', () => jest.fn( () => null ) );

const mockSizeMap = jest.fn();
jest.mock( '../component', () => ( {
	__esModule: true,
	default: require( '@wordpress/element' ).forwardRef( ( { children }, ref ) => {
		if ( ref ) {
			ref.current = { sizeMap: mockSizeMap };
		}
		return <div>{ children }</div>;
	} ),
} ) );

describe( 'Map Block - Real-time Resizing', () => {
	beforeEach( () => {
		resizableBoxProps.length = 0;
		jest.clearAllMocks();
	} );

	it( 'updates map size in real time on drag and persists height on stop', () => {
		const setAttributes = jest.fn();
		render(
			<MapEdit
				attributes={ { points: [], mapHeight: 400 } }
				setAttributes={ setAttributes }
				noticeOperations={ { removeAllNotices: jest.fn(), createErrorNotice: jest.fn() } }
				isSelected
			/>
		);

		const latestProps = resizableBoxProps.at( -1 );
		const elt = { style: { height: '520px' }, offsetHeight: 520 };

		latestProps.onResize( {}, 'bottom', elt );
		expect( mockSizeMap ).toHaveBeenCalledWith( 520 );

		latestProps.onResizeStop( {}, 'bottom', elt );
		expect( setAttributes ).toHaveBeenCalledWith( { mapHeight: 520 } );
	} );
} );
