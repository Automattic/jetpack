import { afterEach, describe, expect, test } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { ALL_AI_AGENTS_ACTOR_ID } from '../../components/ActivityLog/actor-elements';
import { usePresetFilters } from '../use-preset-filters';

const PAGE = '/wp-admin/admin.php?page=jetpack-activity-log';

const visit = ( url: string, state: unknown = null ) =>
	window.history.replaceState( state, '', url );

afterEach( () => visit( '/' ) );

describe( 'usePresetFilters', () => {
	test( 'returns the preset and removes it from the address, so a reload does not bring it back', () => {
		visit( `${ PAGE }&actor=mcp%3A%2A`, { key: 'router' } );

		const { result } = renderHook( () => usePresetFilters( true ) );

		expect( result.current ).toEqual( [
			{ field: 'actor', operator: 'isAny', value: [ ALL_AI_AGENTS_ACTOR_ID ] },
		] );
		expect( window.location.search ).toBe( '?page=jetpack-activity-log' );
		expect( window.history.state ).toEqual( { key: 'router' } );
	} );

	test( 'removes an ignored actor from the address too', () => {
		visit( `${ PAGE }&actor=mcp%3A%2A` );

		const { result } = renderHook( () => usePresetFilters( false ) );

		expect( result.current ).toEqual( [] );
		expect( window.location.search ).toBe( '?page=jetpack-activity-log' );
	} );

	test( 'leaves an address without an actor alone', () => {
		visit( `${ PAGE }&p=%2F` );

		renderHook( () => usePresetFilters( true ) );

		expect( window.location.search ).toBe( '?page=jetpack-activity-log&p=%2F' );
	} );
} );
