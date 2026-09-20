/**
 * Type-level tests for the `wpcomUser` object on the ambient
 * `JP_CONNECTION_INITIAL_STATE` global.
 *
 * `tsgo --noEmit` enforces these, not Jest — Babel strips the types before the run. An
 * unused `@ts-expect-error` is itself a compile error, so each directive below fails in
 * both directions.
 */
import type { UserConnectionData } from '../components/use-connection/types.ts';
import type { WpcomUser } from '../types.ts';

/** Resolved through `declarations.d.ts` rather than imported, so a rewiring breaks it too. */
type GlobalWpcomUser =
	Window[ 'JP_CONNECTION_INITIAL_STATE' ][ 'userConnectionData' ][ 'currentUser' ][ 'wpcomUser' ];

/** The type `useConnection()` hands its consumers. */
type UseConnectionWpcomUser = NonNullable<
	NonNullable< UserConnectionData[ 'currentUser' ] >[ 'wpcomUser' ]
>;

/** `true` only when two types are mutually assignable. */
type Same< A, B > = [ A ] extends [ B ] ? ( [ B ] extends [ A ] ? true : false ) : false;

describe( 'JP_CONNECTION_INITIAL_STATE wpcomUser', () => {
	test( 'the global is wired to WpcomUser', () => {
		// Fails to compile as `const wired: false = true` if the two drift apart.
		const wired: Same< GlobalWpcomUser, WpcomUser > = true;

		expect( wired ).toBe( true );
	} );

	test( 'useConnection() resolves to that same declaration', () => {
		// Fails to compile as `const unified: false = true` if the two are split again.
		const unified: Same< UseConnectionWpcomUser, WpcomUser > = true;

		expect( unified ).toBe( true );
	} );

	test( 'exposes the identity jetpackAnalytics.initialize() needs, uncast', () => {
		const user: GlobalWpcomUser = { ID: 99999, login: 'bobsacramento', avatar: false };

		const id: number | undefined = user.ID;
		const login: string | undefined = user.login;

		expect( { id, login } ).toEqual( { id: 99999, login: 'bobsacramento' } );
	} );

	test( 'rejects the `Id` misspelling instead of resolving it to unknown', () => {
		const user: GlobalWpcomUser = { ID: 99999, avatar: false };

		// @ts-expect-error WordPress.com spells it `ID`; an index signature would hide this.
		const misspelled = user.Id;

		expect( misspelled ).toBeUndefined();
	} );

	test( 'rejects any other undeclared field, so the shape stays closed', () => {
		const user: GlobalWpcomUser = { avatar: false };

		// @ts-expect-error Not a field WordPress.com returns, and nothing absorbs it.
		const undeclared = user.userEmail;

		expect( undeclared ).toBeUndefined();
	} );

	test( 'types avatar as a URL or false, never as a boolean', () => {
		const user: GlobalWpcomUser = { avatar: 'https://example.com/avatar.png' };

		const avatar: string | false = user.avatar;

		// @ts-expect-error `avatar` is `string | false`; the superseded `boolean`
		// declaration accepted this, so an unused directive means the widening was reverted.
		const asBoolean: boolean = user.avatar;

		expect( asBoolean ).toBe( avatar );
	} );

	test( 'requires avatar, the one field the PHP always sets', () => {
		// @ts-expect-error `avatar` is required — the PHP sets it unconditionally, so the
		// emptiest this object gets is `{ avatar: false }`. Every other field is optional.
		const user: GlobalWpcomUser = {};

		expect( user ).toEqual( {} );
	} );

	test( 'no longer accepts the `true` that the boolean declaration allowed', () => {
		// @ts-expect-error `avatar` is a URL or `false`; `get_avatar_url()` never returns `true`.
		const user: GlobalWpcomUser = { avatar: true };

		expect( user.avatar ).toBe( true );
	} );
} );
