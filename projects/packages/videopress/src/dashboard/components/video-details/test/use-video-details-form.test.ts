import { act, renderHook } from '@testing-library/react';
import { useVideoDetailsForm } from '../use-video-details-form';
import type { LibraryItem } from '../../../types/library';

const video = {
	id: '1',
	title: 'Video',
	description: 'Old description',
	privacy: 'public',
	displayEmbed: true,
	allowDownloads: true,
	rating: 'G',
} as unknown as LibraryItem;

describe( 'useVideoDetailsForm patchBaseline', () => {
	it( 'moves value and baseline together for the patched field', () => {
		const { result } = renderHook( () => useVideoDetailsForm( video ) );

		act( () => result.current.patchBaseline( { description: 'New description' } ) );

		expect( result.current.values.description ).toBe( 'New description' );
		expect( result.current.isDirty ).toBe( false );
	} );

	it( 'keeps other fields dirty across a baseline patch', () => {
		const { result } = renderHook( () => useVideoDetailsForm( video ) );

		act( () => result.current.update( { title: 'Edited title' } ) );
		act( () => result.current.patchBaseline( { description: 'New description' } ) );

		expect( result.current.values.title ).toBe( 'Edited title' );
		expect( result.current.isDirty ).toBe( true );
	} );
} );
