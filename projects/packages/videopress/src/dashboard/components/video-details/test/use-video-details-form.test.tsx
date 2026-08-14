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

	/*
	 * The upload flow's draft session: the form starts on a synthetic record
	 * (queue id, filename-derived title) and re-binds to the real attachment
	 * when the upload settles. Edited fields must survive that id change;
	 * untouched fields must follow the real record, so a title the user never
	 * typed doesn't shadow the server's.
	 */
	it( 'preserveDirtyOnRebind keeps edited fields and adopts the rest on an id change', () => {
		const draft = makeLibraryItem( {
			id: 'upload-1',
			title: 'clip',
			description: '',
			rating: 'G',
		} );
		const { result, rerender } = renderHook(
			( item: typeof video ) => useVideoDetailsForm( item, { preserveDirtyOnRebind: true } ),
			{
				initialProps: draft,
			}
		);

		act( () => result.current.update( { title: 'My launch video' } ) );
		rerender(
			makeLibraryItem( { id: '77', title: 'clip', description: 'Server cut', rating: 'PG-13' } )
		);

		// The typed title survives; the untouched fields take the record's.
		expect( result.current.values.title ).toBe( 'My launch video' );
		expect( result.current.values.description ).toBe( 'Server cut' );
		expect( result.current.values.rating ).toBe( 'PG-13' );
		// The kept edit reads as unsaved against the NEW baseline — Save must
		// light up for it.
		expect( result.current.isDirty ).toBe( true );

		// reset(values) after the save settles the form clean, as on any save.
		act( () => result.current.reset( result.current.values ) );
		expect( result.current.isDirty ).toBe( false );
	} );

	it( 'preserveDirtyOnRebind leaves a clean form fully re-baselined', () => {
		const draft = makeLibraryItem( { id: 'upload-1', title: 'clip', description: '' } );
		const { result, rerender } = renderHook(
			( item: typeof video ) => useVideoDetailsForm( item, { preserveDirtyOnRebind: true } ),
			{
				initialProps: draft,
			}
		);

		rerender( makeLibraryItem( { id: '77', title: 'Real title', description: 'Real cut' } ) );

		expect( result.current.values.title ).toBe( 'Real title' );
		expect( result.current.values.description ).toBe( 'Real cut' );
		expect( result.current.isDirty ).toBe( false );
	} );
	it( 'reports only the fields that diverge from the baseline', () => {
		const { result } = renderHook( () => useVideoDetailsForm( video ) );

		expect( result.current.dirtyValues ).toEqual( {} );

		act( () => result.current.update( { title: 'My Clip 2' } ) );
		// The diff, not the whole form: it is written through to the upload's
		// queue row on every keystroke.
		expect( result.current.dirtyValues ).toEqual( { title: 'My Clip 2' } );

		act( () => result.current.update( { title: 'My Clip' } ) );
		expect( result.current.dirtyValues ).toEqual( {} );
	} );

	it( 'seeds initialDraft over the record, as unsaved', () => {
		const { result } = renderHook( () =>
			useVideoDetailsForm( video, { initialDraft: { title: 'Launch week recap' } } )
		);

		expect( result.current.values.title ).toBe( 'Launch week recap' );
		// Untouched fields still come from the record.
		expect( result.current.values.description ).toBe( 'First cut' );
		// Carried edits are unsaved against the server record — that is exactly
		// what they are, and Save has to light up for them.
		expect( result.current.isDirty ).toBe( true );
		expect( result.current.dirtyValues ).toEqual( { title: 'Launch week recap' } );
	} );

	it( 'reads initialDraft once, at mount', () => {
		const { result, rerender } = renderHook(
			( draft: { title?: string } ) => useVideoDetailsForm( video, { initialDraft: draft } ),
			{ initialProps: { title: 'First seed' } }
		);

		// The row's draft keeps changing as the user types — re-seeding from it
		// would fight the very input that produced it.
		rerender( { title: 'Later value' } );

		expect( result.current.values.title ).toBe( 'First seed' );
	} );
} );
