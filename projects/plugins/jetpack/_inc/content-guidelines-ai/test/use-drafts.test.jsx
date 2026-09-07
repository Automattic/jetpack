import { act, renderHook } from '@testing-library/react';
import { useSectionHasDraft, useAllSectionsEmpty, useBlockHasDraft } from '../hooks/use-drafts';
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

	describe( 'useSectionHasDraft', () => {
		it( 'reflects whether the section has text and follows edits', async () => {
			renderSections( { site: 'A cooking blog.' } );
			await flushObserver();
			const { result } = renderHook( () => useSectionHasDraft( 'site' ) );
			expect( result.current ).toBe( true );

			act( () => {
				typeInto( getSectionTextarea( 'site' ), '' );
			} );
			expect( result.current ).toBe( false );
		} );

		it( 'is false when the section is not rendered', () => {
			const { result } = renderHook( () => useSectionHasDraft( 'copy' ) );
			expect( result.current ).toBe( false );
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

	describe( 'useBlockHasDraft', () => {
		it( 'reflects whether the modal textarea has text and follows edits', async () => {
			const { modal, textarea } = renderBlockModal( 'Keep paragraphs short.' );
			await flushObserver();
			const { result } = renderHook( () => useBlockHasDraft( modal ) );
			expect( result.current ).toBe( true );

			act( () => {
				typeInto( textarea, '' );
			} );
			expect( result.current ).toBe( false );
		} );

		it( 'is false without a modal', () => {
			const { result } = renderHook( () => useBlockHasDraft( null ) );
			expect( result.current ).toBe( false );
		} );
	} );
} );
