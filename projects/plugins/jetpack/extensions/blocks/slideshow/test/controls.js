import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PanelControls } from '../controls';

const images = [
	{
		alt: 'Tree 1',
		caption: '',
		id: '1',
		url: 'http://localhost:4759/wp-content/uploads/2021/03/tree1.jpeg',
		link: '',
		hasCustomLink: false,
	},
	{
		alt: 'Tree 2',
		caption: '',
		id: '2',
		url: 'http://localhost:4759/wp-content/uploads/2021/03/tree2.jpeg',
		link: 'https://test.com',
		hasCustomLink: true,
	},
];

const setAttributes = jest.fn();
const onChangeImageSize = jest.fn();
const setImageAttributes = jest.fn();

const panelProps = {
	attributes: { autoplay: false, delay: 1, effect: 'slide', images, sizeSlug: 'large' },
	imageSizeOptions: [ { label: 'Thumbnail', value: 'thumbnail' } ],
	onChangeImageSize,
	setAttributes,
	setImageAttributes,
};

beforeEach( () => {
	setAttributes.mockClear();
} );

describe( 'Panel controls', () => {
	test( 'loads all panel controls', () => {
		render( <PanelControls { ...panelProps } /> );

		expect( screen.getByLabelText( 'Autoplay' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Transition' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Size' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Image Link URL' ) ).toBeInTheDocument();
	} );

	test( 'toggles autoplay attribute', async () => {
		const user = userEvent.setup();
		render( <PanelControls { ...panelProps } /> );
		await user.click( screen.getByLabelText( 'Autoplay' ) );

		expect( setAttributes ).toHaveBeenCalledWith( { autoplay: true } );
	} );

	test( 'sets transition attribute', async () => {
		const user = userEvent.setup();
		render( <PanelControls { ...panelProps } /> );
		await user.selectOptions( screen.getByLabelText( 'Transition' ), [ 'fade' ] );

		expect( setAttributes ).toHaveBeenCalledWith( { effect: 'fade' } );
	} );

	test( 'calls onChangeImageSize callback when new image size selected', async () => {
		const user = userEvent.setup();
		render( <PanelControls { ...panelProps } /> );
		await user.selectOptions( screen.getByLabelText( 'Size' ), [ 'thumbnail' ] );

		expect( onChangeImageSize ).toHaveBeenCalledWith( 'thumbnail' );
	} );
	test( 'calls handleSaveLink and setImageAttributes when Save Link button is clicked with a URL', async () => {
		const user = userEvent.setup();
		const linkValue = 'https://example.com';

		render( <PanelControls { ...panelProps } /> );

		await user.type( screen.getByLabelText( /image link url/i ), linkValue );
		await user.click( screen.getByRole( 'button', { name: /save link/i } ) );

		expect( setImageAttributes ).toHaveBeenCalledWith(
			undefined, // this would be selectedImageIndex, but we're in the context of the inspector in this test, and focussing on the attributes.
			{
				link: linkValue,
				hasCustomLink: true,
			}
		);
	} );
} );

describe( 'Toolbar controls', () => {
	// It isn't possible to test that Toolbar controls renders correctly
	// until monorepo is updated to have WP 5.6 compatible dependencies as 'ToolbarItem
	// is not curently in the jest dependency tree.
} );
