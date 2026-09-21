import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';

let isCFMEnabled;

await jest.unstable_mockModule( '../../../../hooks/use-config-value.ts', () => ( {
	default: key => ( key === 'isCentralFormManagementEnabled' ? isCFMEnabled : undefined ),
} ) );

const { default: useTopNavigation } = await import( '../use-top-navigation.ts' );

beforeEach( () => {
	isCFMEnabled = true;
} );

describe( 'useTopNavigation', () => {
	it( 'marks the active section as current, and only it', () => {
		const { result } = renderHook( () => useTopNavigation( { activeTab: 'responses' } ) );

		expect( result.current.items.map( item => item.href ) ).toEqual( [
			'/forms',
			'/responses/inbox',
		] );
		expect( result.current.currentHref ).toBe( '/responses/inbox' );
	} );

	it( 'points Responses at the inbox list, which is where the section opens', () => {
		const { result } = renderHook( () => useTopNavigation( { activeTab: 'forms' } ) );

		expect( result.current.currentHref ).toBe( '/forms' );
		expect( result.current.items[ 1 ].href ).toBe( '/responses/inbox' );
	} );

	it( 'renders nothing with Central Form Management off: Responses is the only section', () => {
		isCFMEnabled = false;

		const { result } = renderHook( () => useTopNavigation( { activeTab: 'responses' } ) );

		expect( result.current ).toBeUndefined();
	} );

	it( "renders nothing on one form's responses, a child of Forms rather than a sibling", () => {
		const { result } = renderHook( () =>
			useTopNavigation( { activeTab: 'responses', isSingleFormView: true } )
		);

		expect( result.current ).toBeUndefined();
	} );
} );
