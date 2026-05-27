import { blackboxClient } from '@/lib/blackbox-client';
import { blackboxClientId, isBlackboxEnrolled } from '@/lib/is-blackbox-enrolled';

describe( 'Blackbox client adapter', () => {
	afterEach( () => {
		// @ts-expect-error - PHP injects the global at runtime; tests poke it.
		delete window.akismetExperimental;
	} );

	describe( 'isBlackboxEnrolled', () => {
		it( 'returns false when no global is set', () => {
			expect( isBlackboxEnrolled() ).toBe( false );
		} );

		it( 'returns true when PHP reports enrolled', () => {
			(
				window as unknown as {
					akismetExperimental: { blackbox: { enrolled: boolean; clientId: string } };
				}
			 ).akismetExperimental = {
				blackbox: { enrolled: true, clientId: 'bbx_test_client' },
			};
			expect( isBlackboxEnrolled() ).toBe( true );
		} );

		it( 'returns false when PHP reports not enrolled', () => {
			(
				window as unknown as {
					akismetExperimental: { blackbox: { enrolled: boolean; clientId: null } };
				}
			 ).akismetExperimental = {
				blackbox: { enrolled: false, clientId: null },
			};
			expect( isBlackboxEnrolled() ).toBe( false );
		} );
	} );

	describe( 'blackboxClientId', () => {
		it( 'returns null when not enrolled', () => {
			expect( blackboxClientId() ).toBeNull();
		} );

		it( 'returns the client ID when enrolled', () => {
			(
				window as unknown as {
					akismetExperimental: { blackbox: { enrolled: boolean; clientId: string } };
				}
			 ).akismetExperimental = {
				blackbox: { enrolled: true, clientId: 'bbx_test_client' },
			};
			expect( blackboxClientId() ).toBe( 'bbx_test_client' );
		} );
	} );

	describe( 'blackboxClient.ping', () => {
		it( 'resolves to { ok: true }', async () => {
			await expect( blackboxClient.ping() ).resolves.toEqual( { ok: true } );
		} );
	} );
} );
