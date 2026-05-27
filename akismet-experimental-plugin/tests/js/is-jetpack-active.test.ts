import { allowMutations, isJetpackActive, readGlobal } from '@/lib/is-jetpack-active';

describe( 'runtime globals', () => {
	afterEach( () => {
		// @ts-expect-error - the global is set by PHP at runtime; tests poke it.
		delete window.akismetExperimental;
	} );

	describe( 'readGlobal', () => {
		it( 'returns an empty object when nothing is set', () => {
			expect( readGlobal() ).toEqual( {} );
		} );

		it( 'returns the global when it exists', () => {
			( window as unknown as { akismetExperimental: { apiNonce: string } } ).akismetExperimental = {
				apiNonce: 'abc123',
			};
			expect( readGlobal() ).toEqual( { apiNonce: 'abc123' } );
		} );
	} );

	describe( 'isJetpackActive', () => {
		it( 'returns false when no global is set', () => {
			expect( isJetpackActive() ).toBe( false );
		} );

		it( 'returns true when jetpackActive is true', () => {
			(
				window as unknown as { akismetExperimental: { jetpackActive: boolean } }
			 ).akismetExperimental = {
				jetpackActive: true,
			};
			expect( isJetpackActive() ).toBe( true );
		} );

		it( 'returns false when jetpackActive is false', () => {
			(
				window as unknown as { akismetExperimental: { jetpackActive: boolean } }
			 ).akismetExperimental = {
				jetpackActive: false,
			};
			expect( isJetpackActive() ).toBe( false );
		} );
	} );

	describe( 'allowMutations', () => {
		it( 'defaults to false when nothing is set', () => {
			expect( allowMutations() ).toBe( false );
		} );

		it( 'returns true only when explicitly set true', () => {
			(
				window as unknown as { akismetExperimental: { allowMutations: boolean } }
			 ).akismetExperimental = {
				allowMutations: true,
			};
			expect( allowMutations() ).toBe( true );
		} );

		it( 'returns false when explicitly set false', () => {
			(
				window as unknown as { akismetExperimental: { allowMutations: boolean } }
			 ).akismetExperimental = {
				allowMutations: false,
			};
			expect( allowMutations() ).toBe( false );
		} );
	} );
} );
