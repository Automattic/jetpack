import { act, renderHook } from '@testing-library/react';
import { makeLibraryItem } from '../../../test-utils/library-item';
import { useVideoDetailsForm } from '../use-video-details-form';

const video = makeLibraryItem( { title: 'My Clip', description: 'First cut' } );

describe( 'useVideoDetailsForm', () => {
	it( 'starts clean, mirroring the record it was given', () => {
		const { result } = renderHook( () => useVideoDetailsForm( video ) );

		expect( result.current.isDirty ).toBe( false );
		expect( result.current.values.title ).toBe( 'My Clip' );
		expect( result.current.values.description ).toBe( 'First cut' );
	} );

	it( 'goes dirty on update and stays dirty until reset', () => {
		const { result } = renderHook( () => useVideoDetailsForm( video ) );

		act( () => result.current.update( { title: 'My Clip 2' } ) );

		expect( result.current.values.title ).toBe( 'My Clip 2' );
		expect( result.current.isDirty ).toBe( true );
	} );

	// The discard path: reset with no argument restores the last baseline.
	it( 'reset() restores the baseline values', () => {
		const { result } = renderHook( () => useVideoDetailsForm( video ) );

		act( () => result.current.update( { title: 'Scratch', rating: 'R' } ) );
		act( () => result.current.reset() );

		expect( result.current.values.title ).toBe( 'My Clip' );
		expect( result.current.values.rating ).toBe( 'G' );
		expect( result.current.isDirty ).toBe( false );
	} );

	// The save path: the stage calls reset(values) in updateMeta's onSuccess,
	// which has to move the baseline forward rather than undo the edit.
	it( 'reset( next ) re-baselines to the saved values', () => {
		const { result } = renderHook( () => useVideoDetailsForm( video ) );

		act( () => result.current.update( { title: 'Saved title' } ) );
		act( () => result.current.reset( result.current.values ) );

		expect( result.current.values.title ).toBe( 'Saved title' );
		expect( result.current.isDirty ).toBe( false );
	} );

	/*
	 * The re-baseline effect keys on `[ video.id ]` alone, which is
	 * exhaustive-deps hostile and looks like a bug. It isn't: `useVideo`
	 * refetches every 2s while a video is processing, and each refetch hands
	 * down a NEW object. Keying on the whole record would wipe whatever the
	 * user was mid-way through typing. This test locks that in.
	 */
	it( 'does not clobber in-progress edits when the same video refetches', () => {
		const { result, rerender } = renderHook(
			( item: typeof video ) => useVideoDetailsForm( item ),
			{
				initialProps: video,
			}
		);

		act( () => result.current.update( { title: 'Half-typed' } ) );
		rerender( makeLibraryItem( { title: 'My Clip', description: 'First cut' } ) );

		expect( result.current.values.title ).toBe( 'Half-typed' );
		expect( result.current.isDirty ).toBe( true );
	} );

	it( 're-baselines when the id changes', () => {
		const { result, rerender } = renderHook(
			( item: typeof video ) => useVideoDetailsForm( item ),
			{
				initialProps: video,
			}
		);

		act( () => result.current.update( { title: 'Half-typed' } ) );
		rerender( makeLibraryItem( { id: '43', title: 'Other clip', description: 'Other cut' } ) );

		expect( result.current.values.title ).toBe( 'Other clip' );
		expect( result.current.values.description ).toBe( 'Other cut' );
		expect( result.current.isDirty ).toBe( false );
	} );
} );
