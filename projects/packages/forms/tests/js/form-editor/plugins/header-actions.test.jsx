/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

const mockEditor = {
	getCurrentPostId: jest.fn(),
	isEditedPostNew: jest.fn(),
};

// `Fill` needs a matching Slot to render anything, so stand it in for the test.
await jest.unstable_mockModule( '@wordpress/components', () => ( {
	Fill: ( { children } ) => <div data-testid="pinned-items">{ children }</div>,
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useSelect: selector => selector( () => mockEditor ),
} ) );

await jest.unstable_mockModule( '@wordpress/editor', () => ( {
	store: 'core/editor',
} ) );

const { HeaderActions } = await import( '../../../../src/form-editor/plugins/header-actions' );

describe( 'HeaderActions', () => {
	beforeEach( () => {
		mockEditor.getCurrentPostId.mockReset();
		mockEditor.isEditedPostNew.mockReset();
	} );

	it( 'renders nothing before the form has been saved', () => {
		mockEditor.getCurrentPostId.mockReturnValue( 0 );
		mockEditor.isEditedPostNew.mockReturnValue( true );

		const { container } = render( <HeaderActions /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing for a new post that already has an ID', () => {
		mockEditor.getCurrentPostId.mockReturnValue( 7 );
		mockEditor.isEditedPostNew.mockReturnValue( true );

		const { container } = render( <HeaderActions /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders a real link to the responses for a saved form', () => {
		mockEditor.getCurrentPostId.mockReturnValue( 7 );
		mockEditor.isEditedPostNew.mockReturnValue( false );

		render( <HeaderActions /> );

		const link = screen.getByRole( 'link', { name: 'View responses' } );
		expect( link ).toHaveAttribute( 'href', expect.stringContaining( 'sourceId%3D7' ) );
	} );

	it( 'keeps the class the stylesheet uses to hide it on narrow viewports', () => {
		mockEditor.getCurrentPostId.mockReturnValue( 7 );
		mockEditor.isEditedPostNew.mockReturnValue( false );

		render( <HeaderActions /> );

		/*
		 * `@wordpress/interface` hides pinned items below its small breakpoint via a
		 * `.interface-pinned-items .components-button` rule that this anchor does not
		 * match, so header-actions.scss reapplies it against this class. Dropping the
		 * class would silently bring the button back on narrow viewports.
		 */
		expect( screen.getByRole( 'link', { name: 'View responses' } ) ).toHaveClass(
			'jetpack-form-header-actions__view-responses'
		);
	} );
} );
