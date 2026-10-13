import { getBlueskyHandleHint, validateConnectInputs } from '../connect-input-validation';

describe( 'validateConnectInputs', () => {
	describe( 'mastodon', () => {
		it( 'accepts a handle and trims it', () => {
			const { values, error } = validateConnectInputs( 'mastodon', {
				instance: '  @user@mastodon.social  ',
			} );

			expect( values ).toEqual( { instance: '@user@mastodon.social' } );
			expect( error ).toBeUndefined();
		} );

		it( 'rejects a malformed handle', () => {
			const { error } = validateConnectInputs( 'mastodon', { instance: 'user' } );

			expect( error ).toEqual( {
				field: 'instance',
				code: 'invalid',
				message: 'Invalid Mastodon username',
			} );
		} );

		it( 'rejects an already connected account', () => {
			const { error } = validateConnectInputs(
				'mastodon',
				{ instance: '@user@mastodon.social' },
				{ isAlreadyConnected: handle => handle === '@user@mastodon.social' }
			);

			expect( error?.code ).toBe( 'duplicate' );
		} );

		it( 'lets a reconnect through the duplicate check', () => {
			const { error } = validateConnectInputs(
				'mastodon',
				{ instance: '@user@mastodon.social' },
				{ allowDuplicate: true, isAlreadyConnected: () => true }
			);

			expect( error ).toBeUndefined();
		} );
	} );

	describe( 'bluesky', () => {
		it( 'drops a leading @ from the handle', () => {
			const { values, error } = validateConnectInputs( 'bluesky', {
				handle: '@user.bsky.social',
				app_password: ' abcd-efgh ',
			} );

			expect( values ).toEqual( { handle: 'user.bsky.social', app_password: 'abcd-efgh' } );
			expect( error ).toBeUndefined();
		} );

		it( 'rejects a handle without a domain', () => {
			const { error } = validateConnectInputs( 'bluesky', {
				handle: 'user',
				app_password: 'abcd-efgh',
			} );

			expect( error ).toEqual( {
				field: 'handle',
				code: 'invalid',
				message: 'Invalid Bluesky handle',
			} );
		} );

		it( 'requires an app password', () => {
			const { error } = validateConnectInputs( 'bluesky', { handle: 'user.bsky.social' } );

			expect( error?.field ).toBe( 'app_password' );
		} );
	} );

	it( 'has nothing to validate for services without inputs', () => {
		expect( validateConnectInputs( 'facebook', {} ) ).toEqual( { values: {} } );
	} );
} );

describe( 'getBlueskyHandleHint', () => {
	it( 'flags dots in the username part of a bsky.social handle', () => {
		expect( getBlueskyHandleHint( 'foo.bar.bsky.social' ) ).toMatch(
			/Bluesky usernames cannot contain dots/
		);
	} );

	it( 'says nothing about a plain bsky.social handle', () => {
		expect( getBlueskyHandleHint( 'foo.bsky.social' ) ).toBeNull();
	} );

	it( 'says nothing about a custom domain', () => {
		expect( getBlueskyHandleHint( 'my.custom.domain' ) ).toBeNull();
	} );
} );
