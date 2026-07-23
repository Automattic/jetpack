import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect, useDispatch } from '@wordpress/data';
import SuggestionActions from '../components/suggestion-actions';
import { acceptSectionSuggestion } from '../lib/dom';
import { recordGuidelinesEvent } from '../lib/tracks';

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );
jest.mock( '@wordpress/components', () => ( {
	Button: ( {
		children,
		onClick,
		disabled,
		href,
		className,
		style,
		label,
		'aria-hidden': ariaHidden,
	} ) => (
		<button
			type="button"
			onClick={ onClick }
			disabled={ disabled }
			href={ href }
			className={ className }
			style={ style }
			aria-hidden={ ariaHidden }
			aria-label={ label }
		>
			{ children }
		</button>
	),
	Tooltip: ( { children } ) => children,
	Notice: ( { children, onRemove, isDismissible } ) => (
		<div>
			{ children }
			{ isDismissible !== false && (
				<button type="button" aria-label="Close" onClick={ onRemove }>
					Close
				</button>
			) }
		</div>
	),
	Spinner: () => <span className="components-spinner" />,
} ) );
jest.mock( '../lib/dom', () => ( { acceptSectionSuggestion: jest.fn() } ) );
jest.mock( '../lib/tracks', () => ( { recordGuidelinesEvent: jest.fn() } ) );

const clearSuggestion = jest.fn();

function setup( { suggestion = '', sectionLoading = false } ) {
	useDispatch.mockReturnValue( { clearSuggestion } );
	const selectors = {
		getSuggestion: () => suggestion,
		isSectionLoading: () => sectionLoading,
	};
	useSelect.mockImplementation( map => map( () => selectors ) );
}

let user;

describe( 'SuggestionActions', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		user = userEvent.setup();
	} );

	it( 'renders nothing without a suggestion', async () => {
		setup( { suggestion: '' } );
		const { container } = render( <SuggestionActions slug="copy" /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'accepts the suggestion into the section on Accept', async () => {
		setup( { suggestion: 'Improved guideline.' } );
		render( <SuggestionActions slug="copy" /> );

		await user.click( screen.getByRole( 'button', { name: 'Accept suggestion' } ) );

		expect( recordGuidelinesEvent ).toHaveBeenCalledWith( 'accept', {
			type: 'section',
			slug: 'copy',
		} );
		expect( acceptSectionSuggestion ).toHaveBeenCalledWith(
			'copy',
			'Improved guideline.',
			clearSuggestion
		);
	} );

	it( 'discards the suggestion on Dismiss without writing it', async () => {
		setup( { suggestion: 'Improved guideline.' } );
		render( <SuggestionActions slug="copy" /> );

		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( recordGuidelinesEvent ).toHaveBeenCalledWith( 'dismiss', {
			type: 'section',
			slug: 'copy',
		} );
		expect( clearSuggestion ).toHaveBeenCalledWith( 'copy' );
		expect( acceptSectionSuggestion ).not.toHaveBeenCalled();
	} );

	it( 'captures the current section draft as the diff baseline and flags the form', async () => {
		// Single-word draft/suggestion so the diff is one clean removed token.
		setup( { suggestion: 'newguideline' } );

		// The effect reads the live draft straight from Gutenberg's section
		// markup, so inject that structure before rendering. Keep a direct ref
		// to the form to assert on it without DOM traversal.
		const item = document.createElement( 'li' );
		item.className = 'guidelines__list-item';
		item.dataset.slug = 'copy';
		const form = document.createElement( 'form' );
		form.innerHTML = '<textarea rows="4">oldguideline</textarea>';
		item.appendChild( form );
		document.body.appendChild( item );

		render( <SuggestionActions slug="copy" /> );

		// The captured draft becomes the diff's removed text. (The injected
		// textarea also holds it, so pick the <del> among the matches.)
		const removed = screen.getAllByText( 'oldguideline' ).find( el => el.tagName === 'DEL' );
		expect( removed ).toBeInTheDocument();
		// ...and the Gutenberg form is flagged so its textarea can be hidden.
		expect( form ).toHaveClass( 'has-jetpack-suggestion' );

		document.body.removeChild( item );
	} );
} );
