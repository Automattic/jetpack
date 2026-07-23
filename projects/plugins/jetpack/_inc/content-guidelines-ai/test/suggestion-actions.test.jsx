import { render, screen, fireEvent } from '@testing-library/react';
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
	Button: ( { children, onClick, disabled, href, className, style, label, 'aria-hidden': ariaHidden } ) => (
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

describe( 'SuggestionActions', () => {
	beforeEach( () => jest.clearAllMocks() );

	it( 'renders nothing without a suggestion', () => {
		setup( { suggestion: '' } );
		const { container } = render( <SuggestionActions slug="copy" /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'accepts the suggestion into the section on Accept', () => {
		setup( { suggestion: 'Improved guideline.' } );
		render( <SuggestionActions slug="copy" /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Accept suggestion' } ) );

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

	it( 'discards the suggestion on Dismiss without writing it', () => {
		setup( { suggestion: 'Improved guideline.' } );
		render( <SuggestionActions slug="copy" /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( recordGuidelinesEvent ).toHaveBeenCalledWith( 'dismiss', {
			type: 'section',
			slug: 'copy',
		} );
		expect( clearSuggestion ).toHaveBeenCalledWith( 'copy' );
		expect( acceptSectionSuggestion ).not.toHaveBeenCalled();
	} );

	it( 'captures the current section draft as the diff baseline and flags the form', () => {
		setup( { suggestion: 'New guideline.' } );

		// The effect reads the live draft straight from Gutenberg's section
		// markup, so inject that structure before rendering.
		const item = document.createElement( 'li' );
		item.className = 'guidelines__list-item';
		item.dataset.slug = 'copy';
		item.innerHTML = '<form><textarea rows="4">Old draft.</textarea></form>';
		document.body.appendChild( item );

		const { container } = render( <SuggestionActions slug="copy" /> );

		// The captured "Old draft." becomes the diff's removed text...
		expect( container.querySelector( 'del' ) ).toHaveTextContent( 'Old' );
		// ...and the Gutenberg form is flagged so its textarea can be hidden.
		expect( item.querySelector( 'form' ).classList.contains( 'has-jetpack-suggestion' ) ).toBe(
			true
		);

		document.body.removeChild( item );
	} );
} );
