import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GalleryImageEdit from '../edit';

jest.mock( '@wordpress/core-data', () => ( { store: 'core' } ) );
jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	return new Proxy( actual, {
		get( target, property ) {
			if ( property === 'withSelect' ) {
				return () => Component => Component;
			}
			return target[ property ];
		},
	} );
} );

const defaultProps = {
	alt: 'Sample image',
	'aria-label': 'image 1 of 2 in gallery',
	columns: 3,
	height: 200,
	id: 1,
	isFirstItem: false,
	isLastItem: false,
	isSelected: false,
	link: 'https://example.com/1',
	linkTo: 'none',
	onMoveBackward: jest.fn(),
	onMoveForward: jest.fn(),
	onRemove: jest.fn(),
	onSelect: jest.fn(),
	origUrl: 'https://example.com/1.jpg',
	setAttributes: jest.fn(),
	showMovers: true,
	url: 'https://example.com/1.jpg',
	width: 200,
};

describe( 'Tiled Gallery - GalleryImageEdit', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'does not render action menu overlays when unselected and selects image on click', async () => {
		const user = userEvent.setup();
		render( <GalleryImageEdit { ...defaultProps } /> );

		expect( screen.queryByLabelText( 'Move image backward' ) ).not.toBeInTheDocument();
		expect( screen.queryByLabelText( 'Move image forward' ) ).not.toBeInTheDocument();
		expect( screen.queryByLabelText( 'Remove image' ) ).not.toBeInTheDocument();

		await user.click( screen.getByAltText( 'Sample image' ) );
		expect( defaultProps.onSelect ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'renders enabled move and remove controls when selected', () => {
		render( <GalleryImageEdit { ...defaultProps } isSelected /> );

		expect( screen.getByLabelText( 'Move image backward' ) ).toBeEnabled();
		expect( screen.getByLabelText( 'Move image forward' ) ).toBeEnabled();
		expect( screen.getByLabelText( 'Remove image' ) ).toBeEnabled();
	} );
} );
