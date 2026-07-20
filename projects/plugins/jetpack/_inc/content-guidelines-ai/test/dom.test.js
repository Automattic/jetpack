import { acceptSectionSuggestion, setTextareaValue } from '../lib/dom';
import { getSectionTextarea } from '../lib/drafts';
import { renderSections } from './fixtures';

describe( 'dom', () => {
	afterEach( () => {
		document.body.innerHTML = '';
	} );

	describe( 'setTextareaValue', () => {
		it( 'sets the value and fires a bubbling input event', () => {
			renderSections();
			const textarea = getSectionTextarea( 'site' );
			const onInput = jest.fn();
			document.addEventListener( 'input', onInput );

			setTextareaValue( textarea, 'New text' );

			expect( textarea.value ).toBe( 'New text' );
			expect( onInput ).toHaveBeenCalledTimes( 1 );
			document.removeEventListener( 'input', onInput );
		} );
	} );

	describe( 'acceptSectionSuggestion', () => {
		it( 'writes the suggestion into the section textarea and clears it from the store', () => {
			renderSections( { copy: 'Old draft' } );
			const textarea = getSectionTextarea( 'copy' );
			const clearSuggestion = jest.fn();
			const onInput = jest.fn();
			document.addEventListener( 'input', onInput );

			acceptSectionSuggestion( 'copy', 'Improved guidelines.', clearSuggestion );

			expect( textarea.value ).toBe( 'Improved guidelines.' );
			// The input event is what makes Gutenberg's React onChange fire, so
			// the page's own draft state stays in sync with what we wrote.
			expect( onInput ).toHaveBeenCalledTimes( 1 );
			expect( clearSuggestion ).toHaveBeenCalledWith( 'copy' );
			document.removeEventListener( 'input', onInput );
		} );

		it( 'keeps the suggestion when the textarea is missing so the text is not lost', () => {
			const clearSuggestion = jest.fn();
			expect( () => acceptSectionSuggestion( 'site', 'Text', clearSuggestion ) ).not.toThrow();
			// Nothing was written, so the suggestion must stay accessible in the
			// UI instead of being silently discarded.
			expect( clearSuggestion ).not.toHaveBeenCalled();
		} );
	} );
} );
