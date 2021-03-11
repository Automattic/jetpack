/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import { PanelControls } from '../controls';

const images = [
	{
		alt: 'Tree 1',
		caption: '',
		id: '1',
		url: 'http://localhost:4759/wp-content/uploads/2021/03/tree1.jpeg',
	},
	{
		alt: 'Tree 2',
		caption: '',
		id: '2',
		url: 'http://localhost:4759/wp-content/uploads/2021/03/tree2.jpeg',
	},
];

const setAttributes = jest.fn();
const onChangeImageSize = jest.fn();
const onSelectImages = jest.fn();

const panelProps = {
	attributes: { autoplay: false, delay: 1, effect: 'slide', images, sizeSlug: 'large' },
	imageSizeOptions: [ { label: 'Thumbnail', value: 'thumbnail' } ],
	onChangeImageSize,
	setAttributes,
};

const toolbarProps = {
	allowedMediaTypes: [ 'image' ],
	attributes: { autoplay: false, delay: 1, effect: 'slide', images, sizeSlug: 'large' },
	onSelectImages,
};

beforeEach( () => {
	setAttributes.mockClear();
} );

describe( 'Panel controls', () => {
	test( 'loads all panel controls', () => {
		render( <PanelControls { ...panelProps } /> );

		expect( screen.getByLabelText( 'Autoplay' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Transition effect' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Image Size' ) ).toBeInTheDocument();
	} );

	test( 'toggles autoplay attribute', () => {
		render( <PanelControls { ...panelProps } /> );
		userEvent.click( screen.getByLabelText( 'Autoplay' ) );

		expect( setAttributes ).toHaveBeenCalledWith( { autoplay: true } );
	} );

	test( 'sets transition attribute', () => {
		render( <PanelControls { ...panelProps } /> );
		userEvent.selectOptions( screen.getByLabelText( 'Transition effect' ), [ 'fade' ] );

		expect( setAttributes ).toHaveBeenCalledWith( { effect: 'fade' } );
	} );

	test( 'calls onChangeImageSize callback when new image size selected', () => {
		render( <PanelControls { ...panelProps } /> );
		userEvent.selectOptions( screen.getByLabelText( 'Image Size' ), [ 'thumbnail' ] );

		expect( onChangeImageSize ).toHaveBeenCalledWith( 'thumbnail' );
	} );
} );

describe( 'Toolbar controls', () => {
	// It isn't possible to test that Toolbar controls renders correctly
	// until monorepo is updated to have WP 5.6 compatible dependencies as 'ToolbarItem
	// is not curently in the jest dependency tree.
} );
