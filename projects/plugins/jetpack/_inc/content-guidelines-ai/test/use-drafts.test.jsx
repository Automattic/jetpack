import { act, renderHook } from '@testing-library/react';
import { useSectionDraft, useAllSectionsEmpty, useBlockDraft } from '../hooks/use-drafts';
import { startDraftTracking, getSectionTextarea } from '../lib/drafts';
import { renderSections, renderBlockModal, typeInto } from './fixtures';

// Fixture renders mutate the DOM, which queues a draft-tracking
// MutationObserver callback; flush it before mounting hooks so its
// notification doesn't fire mid-test outside act().
const flushObserver = () => new Promise( resolve => setTimeout( resolve, 0 ) );

describe( 'use-drafts', () => {
	beforeAll( () => {
		startDraftTracking();
	} );

	// Clear fixtures in beforeEach, not afterEach: the testing-library
	// auto-cleanup must unmount the hooks first, or the draft observer would
	// notify a still-mounted hook outside act() when the DOM reset changes
	// the watched values.
	beforeEach( () => {
		document.body.innerHTML = '';
	} );

	describe( 'useSectionDraft', () => {
		it( 'returns the current draft and follows input events', async () => {
			renderSections( { site: 'A cooking blog.' } );
			await flushObserver();
			const { result } = renderHook( () => useSectionDraft( 'site' ) );
			expect( result.current ).toBe( 'A cooking blog.' );

			act( () => {
				typeInto( getSectionTextarea( 'site' ), 'A woodworking blog.' );
			} );
			expect( result.current ).toBe( 'A woodworking blog.' );
		} );

		it( 'returns an empty string when the section is not rendered', () => {
			const { result } = renderHook( () => useSectionDraft( 'copy' ) );
			expect( result.current ).toBe( '' );
		} );
	} );

	describe( 'useAllSectionsEmpty', () => {
		it( 'flips to false when any section gains text', async () => {
			renderSections();
			await flushObserver();
			const { result } = renderHook( () => useAllSectionsEmpty() );
			expect( result.current ).toBe( true );

			act( () => {
				typeInto( getSectionTextarea( 'additional' ), 'Cite sources.' );
			} );
			expect( result.current ).toBe( false );
		} );
	} );

	describe( 'useBlockDraft', () => {
		it( 'reads the modal textarea and follows input events', async () => {
			const { modal, textarea } = renderBlockModal( 'Keep paragraphs short.' );
			await flushObserver();
			const { result } = renderHook( () => useBlockDraft( modal ) );
			expect( result.current ).toBe( 'Keep paragraphs short.' );

			act( () => {
				typeInto( textarea, '' );
			} );
			expect( result.current ).toBe( '' );
		} );

		it( 'returns an empty string without a modal', () => {
			const { result } = renderHook( () => useBlockDraft( null ) );
			expect( result.current ).toBe( '' );
		} );
	} );
} );
