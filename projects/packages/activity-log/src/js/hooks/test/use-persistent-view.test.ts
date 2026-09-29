import { afterEach, describe, expect, test } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import { ALL_AI_AGENTS_ACTOR_ID } from '../../components/ActivityLog/actor-elements';
import { usePersistentView } from '../use-persistent-view';
import type { Filter, View } from '@wordpress/dataviews';

const DEFAULT: View = { type: 'table', perPage: 20, fields: [ 'published' ] };
const PRESET: Filter[] = [
	{ field: 'actor', operator: 'isAny', value: [ ALL_AI_AGENTS_ACTOR_ID ] },
];
const STORAGE_KEY = 'jetpack-activity-log:view:default';

afterEach( () => window.localStorage.clear() );

describe( 'usePersistentView initial filters', () => {
	test( 'starts with the preset filters', () => {
		const { result } = renderHook( () => usePersistentView( DEFAULT, PRESET ) );

		expect( result.current.view.filters ).toEqual( PRESET );
	} );

	test( 'keeps the saved view and adds the preset filters', () => {
		window.localStorage.setItem( STORAGE_KEY, JSON.stringify( { ...DEFAULT, perPage: 50 } ) );

		const { result } = renderHook( () => usePersistentView( DEFAULT, PRESET ) );

		expect( result.current.view.perPage ).toBe( 50 );
		expect( result.current.view.filters ).toEqual( PRESET );
	} );

	test( 'does not save the preset filters', () => {
		const { result } = renderHook( () => usePersistentView( DEFAULT, PRESET ) );

		act( () => result.current.setView( { ...result.current.view, perPage: 50 } ) );

		const saved = JSON.parse( window.localStorage.getItem( STORAGE_KEY ) ?? '{}' );
		expect( saved.perPage ).toBe( 50 );
		expect( saved.filters ).toBeUndefined();
	} );

	test( 'reset view clears the preset filters', () => {
		const { result } = renderHook( () => usePersistentView( DEFAULT, PRESET ) );

		expect( result.current.isViewModified ).toBe( true );
		act( () => result.current.resetView() );

		expect( result.current.view.filters ).toBeUndefined();
		expect( result.current.isViewModified ).toBe( false );
	} );

	test( 'starts without filters when none are given', () => {
		const { result } = renderHook( () => usePersistentView( DEFAULT ) );

		expect( result.current.view ).toEqual( DEFAULT );
	} );
} );
