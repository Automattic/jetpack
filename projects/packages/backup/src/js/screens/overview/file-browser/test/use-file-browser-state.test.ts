import { act, renderHook } from '@testing-library/react';
import { useFileBrowserState } from '../use-file-browser-state';
import type { FileBrowserItem } from '../../../../data/types';

const REWIND_ID = 1700000000;

const child = ( name: string, type: FileBrowserItem[ 'type' ] = 'file' ): FileBrowserItem => ( {
	id: name,
	name,
	type,
	hasChildren: false,
} );

describe( 'useFileBrowserState — tri-state propagation', () => {
	it( 'partial child selection bubbles "mixed" up to the parent', () => {
		const { result } = renderHook( () => useFileBrowserState() );

		act( () => {
			result.current.addChildNodes( '/', [ child( 'a' ), child( 'b' ) ], REWIND_ID );
		} );
		act( () => {
			result.current.setNodeCheckState( 'a', 'checked', REWIND_ID );
		} );

		expect( result.current.getNode( '/', REWIND_ID )?.checkState ).toBe( 'mixed' );
		expect( result.current.getNode( 'a', REWIND_ID )?.checkState ).toBe( 'checked' );
		expect( result.current.getNode( 'b', REWIND_ID )?.checkState ).toBe( 'unchecked' );
	} );

	it( 'all children checked rolls the parent up to "checked"', () => {
		const { result } = renderHook( () => useFileBrowserState() );

		act( () => {
			result.current.addChildNodes( '/', [ child( 'a' ), child( 'b' ) ], REWIND_ID );
		} );
		act( () => {
			result.current.setNodeCheckState( 'a', 'checked', REWIND_ID );
			result.current.setNodeCheckState( 'b', 'checked', REWIND_ID );
		} );

		expect( result.current.getNode( '/', REWIND_ID )?.checkState ).toBe( 'checked' );
	} );

	it( 'checking the parent propagates "checked" down to every child', () => {
		const { result } = renderHook( () => useFileBrowserState() );

		act( () => {
			result.current.addChildNodes( '/', [ child( 'a' ), child( 'b' ) ], REWIND_ID );
		} );
		act( () => {
			result.current.setNodeCheckState( '/', 'checked', REWIND_ID );
		} );

		expect( result.current.getNode( '/', REWIND_ID )?.checkState ).toBe( 'checked' );
		expect( result.current.getNode( 'a', REWIND_ID )?.checkState ).toBe( 'checked' );
		expect( result.current.getNode( 'b', REWIND_ID )?.checkState ).toBe( 'checked' );
	} );

	it( 'unchecking one of two checked children drops the parent back to "mixed"', () => {
		const { result } = renderHook( () => useFileBrowserState() );

		act( () => {
			result.current.addChildNodes( '/', [ child( 'a' ), child( 'b' ) ], REWIND_ID );
			result.current.setNodeCheckState( '/', 'checked', REWIND_ID );
		} );
		act( () => {
			result.current.setNodeCheckState( 'a', 'unchecked', REWIND_ID );
		} );

		expect( result.current.getNode( '/', REWIND_ID )?.checkState ).toBe( 'mixed' );
		expect( result.current.getNode( 'a', REWIND_ID )?.checkState ).toBe( 'unchecked' );
		expect( result.current.getNode( 'b', REWIND_ID )?.checkState ).toBe( 'checked' );
	} );

	it( 'selection is scoped per rewindId so navigating between backups keeps each one intact', () => {
		const { result } = renderHook( () => useFileBrowserState() );
		const otherRewindId = REWIND_ID + 1;

		act( () => {
			result.current.addChildNodes( '/', [ child( 'a' ) ], REWIND_ID );
			result.current.addChildNodes( '/', [ child( 'a' ) ], otherRewindId );
		} );
		act( () => {
			result.current.setNodeCheckState( 'a', 'checked', REWIND_ID );
		} );

		expect( result.current.getNode( 'a', REWIND_ID )?.checkState ).toBe( 'checked' );
		expect( result.current.getNode( 'a', otherRewindId )?.checkState ).toBe( 'unchecked' );
	} );
} );
