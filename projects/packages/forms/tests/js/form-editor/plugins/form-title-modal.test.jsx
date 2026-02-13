/**
 * Tests for form-editor/plugins/form-title-modal.tsx
 *
 * This file tests the FormTitleModal component which prompts users
 * to name their form when creating a new one in the form editor.
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Handle change event and extract value for TextControl mock.
 *
 * @param {Function} onChange - The onChange callback
 * @return {Function} Event handler
 */
function createTextControlChangeHandler( onChange ) {
	return function handleChange( e ) {
		onChange( e.target.value );
	};
}

/**
 * Helper component for TextControl mock.
 *
 * @param {object}   props           - Component props
 * @param {string}   props.label     - Label for the input
 * @param {string}   props.value     - Current value
 * @param {Function} props.onChange  - Change handler
 * @param {Function} props.onKeyDown - Key down handler
 * @return {object} The component
 */
function TextControlComponent( { label, value, onChange, onKeyDown } ) {
	const handleChange = createTextControlChangeHandler( onChange );

	return (
		<div>
			<label htmlFor="title-input">{ label }</label>
			<input
				id="title-input"
				type="text"
				value={ value }
				onChange={ handleChange }
				onKeyDown={ onKeyDown }
				data-testid="text-control-input"
			/>
		</div>
	);
}

// Mock WordPress components
await jest.unstable_mockModule( '@wordpress/components', () => ( {
	Button: props => {
		const {
			__next40pxDefaultSize,
			isBusy,
			variant,
			onClick,
			type,
			children,
			'aria-disabled': ariaDisabled,
			...buttonProps
		} = props;
		return (
			<button
				type={ type || 'button' }
				onClick={ onClick }
				disabled={ ariaDisabled }
				data-busy={ isBusy }
				data-variant={ variant }
				{ ...buttonProps }
			>
				{ children }
			</button>
		);
	},
	Modal: ( { title, onRequestClose, children, isOpen = true } ) =>
		isOpen ? (
			<div data-testid="modal" role="dialog" aria-label={ title }>
				<h2>{ title }</h2>
				<button onClick={ onRequestClose } data-testid="modal-close">
					Close
				</button>
				{ children }
			</div>
		) : null,
	TextControl: TextControlComponent,
} ) );

// Mock WordPress i18n
await jest.unstable_mockModule( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

// Mock the constants
await jest.unstable_mockModule( '../../../../src/blocks/shared/util/constants.js', () => ( {
	FORM_POST_TYPE: 'jetpack_form',
} ) );

// Mock WordPress data - this will be configured per test
let mockUseSelect;
let mockEditEntityRecord;
let mockSaveEditedEntityRecord;

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useSelect: jest.fn( callback => mockUseSelect( callback ) ),
	useDispatch: jest.fn( store => {
		if ( store === 'core' ) {
			return {
				editEntityRecord: mockEditEntityRecord,
				saveEditedEntityRecord: mockSaveEditedEntityRecord,
			};
		}
		return {};
	} ),
} ) );

await jest.unstable_mockModule( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

await jest.unstable_mockModule( '@wordpress/editor', () => ( {
	store: 'editor',
} ) );

// Import the component after mocks are set up
const FormTitleModalModule = await import(
	'../../../../src/form-editor/plugins/form-title-modal.tsx'
);
const { FormTitleModal } = FormTitleModalModule;

describe( 'FormTitleModal', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockEditEntityRecord = jest.fn().mockResolvedValue( {} );
		mockSaveEditedEntityRecord = jest.fn().mockResolvedValue( {} );
	} );

	const createMockUseSelect = ( {
		postType = 'jetpack_form',
		postTitle = '',
		hasInnerBlocks = false,
		postId = 123,
	} ) => {
		return callback => {
			const mockSelect = storeName => {
				if ( storeName === 'core/editor' || storeName === 'editor' ) {
					return {
						getCurrentPostId: () => postId,
						getCurrentPostType: () => postType,
					};
				}
				if ( storeName === 'core' ) {
					return {
						getEditedEntityRecord: ( kind, name, key ) => {
							if ( kind === 'postType' && name === 'jetpack_form' && key === postId ) {
								return { title: postTitle };
							}
							return null;
						},
					};
				}
				if ( storeName === 'core/block-editor' ) {
					return {
						getBlocks: () => {
							if ( hasInnerBlocks ) {
								return [
									{
										name: 'jetpack/contact-form',
										innerBlocks: [ { name: 'jetpack/field-name' } ],
									},
								];
							}
							return [
								{
									name: 'jetpack/contact-form',
									innerBlocks: [],
								},
							];
						},
					};
				}
				return {};
			};

			return callback( mockSelect );
		};
	};

	it( 'renders modal for new untitled forms without inner blocks', async () => {
		mockUseSelect = createMockUseSelect( {
			postType: 'jetpack_form',
			postTitle: '',
			hasInnerBlocks: false,
		} );

		render( <FormTitleModal /> );

		// Modal should appear
		await waitFor( () => {
			expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();
		} );

		expect( screen.getByText( 'Create form' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Name' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Skip' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Create' ) ).toBeInTheDocument();
	} );

	it( 'renders modal for forms with "Untitled Form" title', async () => {
		mockUseSelect = createMockUseSelect( {
			postType: 'jetpack_form',
			postTitle: 'Untitled Form',
			hasInnerBlocks: false,
		} );

		render( <FormTitleModal /> );

		// Modal should appear for "Untitled Form"
		await waitFor( () => {
			expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();
		} );
	} );

	it( 'does not render modal for forms with titles', () => {
		mockUseSelect = createMockUseSelect( {
			postType: 'jetpack_form',
			postTitle: 'Contact Us Form',
			hasInnerBlocks: false,
		} );

		render( <FormTitleModal /> );

		// Modal should not appear
		expect( screen.queryByTestId( 'modal' ) ).not.toBeInTheDocument();
	} );

	it( 'does not render modal for forms with inner blocks', () => {
		mockUseSelect = createMockUseSelect( {
			postType: 'jetpack_form',
			postTitle: '',
			hasInnerBlocks: true,
		} );

		render( <FormTitleModal /> );

		// Modal should not appear when form has content
		expect( screen.queryByTestId( 'modal' ) ).not.toBeInTheDocument();
	} );

	it( 'does not render modal for non-form post types', () => {
		mockUseSelect = createMockUseSelect( {
			postType: 'post',
			postTitle: '',
			hasInnerBlocks: false,
		} );

		render( <FormTitleModal /> );

		// Modal should not appear for regular posts
		expect( screen.queryByTestId( 'modal' ) ).not.toBeInTheDocument();
	} );

	it( 'saves form title correctly when user submits with a title', async () => {
		mockUseSelect = createMockUseSelect( {
			postType: 'jetpack_form',
			postTitle: '',
			hasInnerBlocks: false,
			postId: 123,
		} );

		render( <FormTitleModal /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();
		} );

		// Type a title
		const input = screen.getByLabelText( 'Name' );
		await userEvent.clear( input );
		await userEvent.type( input, 'My New Form' );

		// Click Create button
		const createButton = screen.getByText( 'Create' );
		await userEvent.click( createButton );

		// Verify the title was saved
		await waitFor( () => {
			expect( mockEditEntityRecord ).toHaveBeenCalledWith( 'postType', 'jetpack_form', 123, {
				title: 'My New Form',
			} );
			expect( mockSaveEditedEntityRecord ).toHaveBeenCalledWith( 'postType', 'jetpack_form', 123 );
		} );

		// Modal should close
		await waitFor( () => {
			expect( screen.queryByTestId( 'modal' ) ).not.toBeInTheDocument();
		} );
	} );

	it( 'saves "Untitled Form" when user submits without a title', async () => {
		mockUseSelect = createMockUseSelect( {
			postType: 'jetpack_form',
			postTitle: '',
			hasInnerBlocks: false,
			postId: 123,
		} );

		render( <FormTitleModal /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();
		} );

		// Click Create button without entering a title
		const createButton = screen.getByText( 'Create' );
		await userEvent.click( createButton );

		// Verify "Untitled Form" was used as fallback
		await waitFor( () => {
			expect( mockEditEntityRecord ).toHaveBeenCalledWith( 'postType', 'jetpack_form', 123, {
				title: 'Untitled Form',
			} );
		} );
	} );

	it( 'trims whitespace from title when saving', async () => {
		mockUseSelect = createMockUseSelect( {
			postType: 'jetpack_form',
			postTitle: '',
			hasInnerBlocks: false,
			postId: 123,
		} );

		render( <FormTitleModal /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();
		} );

		// Type a title with whitespace
		const input = screen.getByLabelText( 'Name' );
		await userEvent.clear( input );
		await userEvent.type( input, '  My Form  ' );

		// Click Create button
		const createButton = screen.getByText( 'Create' );
		await userEvent.click( createButton );

		// Verify the title was trimmed
		await waitFor( () => {
			expect( mockEditEntityRecord ).toHaveBeenCalledWith( 'postType', 'jetpack_form', 123, {
				title: 'My Form',
			} );
		} );
	} );

	it( 'closes modal without saving when user clicks skip', async () => {
		mockUseSelect = createMockUseSelect( {
			postType: 'jetpack_form',
			postTitle: '',
			hasInnerBlocks: false,
		} );

		render( <FormTitleModal /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();
		} );

		// Click Skip button
		const skipButton = screen.getByText( 'Skip' );
		await userEvent.click( skipButton );

		// Modal should close without saving
		await waitFor( () => {
			expect( screen.queryByTestId( 'modal' ) ).not.toBeInTheDocument();
		} );

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
		expect( mockSaveEditedEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'closes modal when user clicks close button', async () => {
		mockUseSelect = createMockUseSelect( {
			postType: 'jetpack_form',
			postTitle: '',
			hasInnerBlocks: false,
		} );

		render( <FormTitleModal /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();
		} );

		// Click close button
		const closeButton = screen.getByTestId( 'modal-close' );
		await userEvent.click( closeButton );

		// Modal should close without saving
		await waitFor( () => {
			expect( screen.queryByTestId( 'modal' ) ).not.toBeInTheDocument();
		} );

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
		expect( mockSaveEditedEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'submits form when user presses Enter in text field', async () => {
		mockUseSelect = createMockUseSelect( {
			postType: 'jetpack_form',
			postTitle: '',
			hasInnerBlocks: false,
			postId: 123,
		} );

		render( <FormTitleModal /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();
		} );

		// Type a title and press Enter
		const input = screen.getByLabelText( 'Name' );
		await userEvent.clear( input );
		await userEvent.type( input, 'My Form{Enter}' );

		// Verify the title was saved
		await waitFor( () => {
			expect( mockEditEntityRecord ).toHaveBeenCalledWith( 'postType', 'jetpack_form', 123, {
				title: 'My Form',
			} );
		} );
	} );

	it( 'shows busy state while saving', async () => {
		// Make save take longer to observe busy state
		mockEditEntityRecord = jest.fn( () => new Promise( resolve => setTimeout( resolve, 100 ) ) );
		mockSaveEditedEntityRecord = jest.fn().mockResolvedValue( {} );

		mockUseSelect = createMockUseSelect( {
			postType: 'jetpack_form',
			postTitle: '',
			hasInnerBlocks: false,
			postId: 123,
		} );

		render( <FormTitleModal /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();
		} );

		// Click Create button
		const createButton = screen.getByText( 'Create' );
		await userEvent.click( createButton );

		// Verify button shows busy state
		await waitFor( () => {
			expect( createButton ).toHaveAttribute( 'data-busy', 'true' );
		} );
	} );

	it( 'does not show modal again after being dismissed once', async () => {
		mockUseSelect = createMockUseSelect( {
			postType: 'jetpack_form',
			postTitle: '',
			hasInnerBlocks: false,
		} );

		const { rerender } = render( <FormTitleModal /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();
		} );

		// Close the modal
		const skipButton = screen.getByText( 'Skip' );
		await userEvent.click( skipButton );

		await waitFor( () => {
			expect( screen.queryByTestId( 'modal' ) ).not.toBeInTheDocument();
		} );

		// Re-render the component
		rerender( <FormTitleModal /> );

		// Modal should not appear again
		expect( screen.queryByTestId( 'modal' ) ).not.toBeInTheDocument();
	} );
} );
