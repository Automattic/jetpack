import findPlatforms from '../src/utils/parse-content/find-platforms.ts';

describe( 'findPlatforms', () => {
	test( 'returns empty array when no platform section found', () => {
		expect( findPlatforms( 'Just a regular issue body.' ) ).toEqual( [] );
	} );

	test( 'returns empty array for empty body', () => {
		expect( findPlatforms( '' ) ).toEqual( [] );
	} );

	test( 'extracts a single platform', () => {
		const body = '### Platform (Simple and/or Atomic)\n\nSimple\n\nMore content';
		expect( findPlatforms( body ) ).toEqual( [ 'Simple' ] );
	} );

	test( 'extracts multiple platforms', () => {
		const body = '### Platform (Simple and/or Atomic)\n\nSimple, Atomic\n\nMore content';
		expect( findPlatforms( body ) ).toEqual( [ 'Simple', 'Atomic' ] );
	} );

	test( 'filters out Self-hosted', () => {
		const body = '### Platform (Simple and/or Atomic)\n\nSimple, Self-hosted, Atomic\n\nMore';
		expect( findPlatforms( body ) ).toEqual( [ 'Simple', 'Atomic' ] );
	} );

	test( 'returns empty array when only Self-hosted', () => {
		const body = '### Platform (Simple and/or Atomic)\n\nSelf-hosted\n\nMore content';
		expect( findPlatforms( body ) ).toEqual( [] );
	} );
} );
