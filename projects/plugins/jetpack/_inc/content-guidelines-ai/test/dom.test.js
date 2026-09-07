import { acceptBlockSuggestion, acceptSectionSuggestion, setTextareaValue } from '../lib/dom';
import { getBlockModalTextarea, getSectionTextarea } from '../lib/drafts';
import { renderBlockModal, renderSections } from './fixtures';

describe( 'dom', () => {
	afterEach( () => {
		document.body.innerHTML = '';
	} );

	describe( 'setTextareaValue', () => {
		it( 'sets the value and fires a bubbling input event', () => {
			renderSections();
			const textarea = getSectionTextarea( 'site' );
			let bubbled = false;
			const onInput = jest.fn( e => {
				bubbled = e.bubbles;
			} );
			document.addEventListener( 'input', onInput );

			setTextareaValue( textarea, 'New text' );

			expect( textarea.value ).toBe( 'New text' );
			expect( onInput ).toHaveBeenCalledTimes( 1 );
			// Must bubble, or the document-level draft listener never sees it.
			expect( bubbled ).toBe( true );
			document.removeEventListener( 'input', onInput );
		} );

		it( 'writes through the native prototype setter, bypassing an instance-level override', () => {
			renderSections();
			const textarea = getSectionTextarea( 'site' );

			// Simulate React controlling the input: it overrides the *instance*
			// value setter and caches the last value in its own tracker. The
			// accept path must bypass that override (via the prototype setter),
			// or React's tracker never registers the change and onChange — and
			// therefore Gutenberg's draft state — is never updated.
			const proto = window.HTMLTextAreaElement.prototype;
			const nativeDesc = Object.getOwnPropertyDescriptor( proto, 'value' );
			const instanceSetter = jest.fn( function ( v ) {
				nativeDesc.set.call( this, v );
			} );
			Object.defineProperty( textarea, 'value', {
				configurable: true,
				get() {
					return nativeDesc.get.call( this );
				},
				set: instanceSetter,
			} );

			setTextareaValue( textarea, 'From AI' );

			// The instance setter (React's override) must NOT have been used.
			// A `textarea.value = ...` implementation would trip this.
			expect( instanceSetter ).not.toHaveBeenCalled();
			expect( textarea.value ).toBe( 'From AI' );
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

	describe( 'acceptBlockSuggestion', () => {
		it( 'writes the suggestion into the modal textarea and clears the store', () => {
			const { modal } = renderBlockModal( 'Old block draft' );
			const clearSuggestion = jest.fn();
			const onInput = jest.fn();
			document.addEventListener( 'input', onInput );

			acceptBlockSuggestion( modal, 'core/paragraph', 'Keep paragraphs short.', clearSuggestion );

			expect( getBlockModalTextarea( modal ).value ).toBe( 'Keep paragraphs short.' );
			expect( onInput ).toHaveBeenCalledTimes( 1 );
			expect( clearSuggestion ).toHaveBeenCalledWith( 'core/paragraph' );
			document.removeEventListener( 'input', onInput );
		} );

		it( 'still clears the store when the modal textarea is gone', () => {
			// Unlike the section path, the block path clears unconditionally: the
			// modal (and its DiffView) is torn down on close, so a lingering
			// suggestion would have nowhere to render. A missing textarea must
			// not leave the store holding a stale block suggestion.
			const clearSuggestion = jest.fn();

			expect( () =>
				acceptBlockSuggestion( null, 'core/image', 'Add alt text.', clearSuggestion )
			).not.toThrow();
			expect( clearSuggestion ).toHaveBeenCalledWith( 'core/image' );
		} );
	} );
} );
