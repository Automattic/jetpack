/**
 * Type-level tests for the `wpcomUser` object on the ambient
 * `JP_CONNECTION_INITIAL_STATE` global.
 *
 * The assertions that matter are the `@ts-expect-error` directives and the
 * `Same<>` check, which `tsgo --noEmit` enforces — Jest cannot see any of it,
 * because Babel strips the types before it runs. An unused `@ts-expect-error` is
 * itself a compile error, so each one fails in both directions: delete the
 * directive and the misspelling has to error on its own; give `WpcomUser` an
 * index signature and the directive goes unused. The `expect()` calls only keep
 * this a valid test file.
 */
import type { WpcomUser } from '../types.ts';

/**
 * The type the ambient declaration actually puts on the global — resolved
 * through `declarations.d.ts`, not imported directly, so this breaks if the
 * wiring is changed rather than only if `WpcomUser` is.
 */
type GlobalWpcomUser =
	Window[ 'JP_CONNECTION_INITIAL_STATE' ][ 'userConnectionData' ][ 'currentUser' ][ 'wpcomUser' ];

/** `true` only when two types are mutually assignable. */
type Same< A, B > = [ A ] extends [ B ] ? ( [ B ] extends [ A ] ? true : false ) : false;

describe( 'JP_CONNECTION_INITIAL_STATE wpcomUser', () => {
	test( 'the global is wired to WpcomUser', () => {
		// Fails to compile as `const wired: false = true` if the two drift apart.
		const wired: Same< GlobalWpcomUser, WpcomUser > = true;

		expect( wired ).toBe( true );
	} );

	test( 'exposes the identity jetpackAnalytics.initialize() needs, uncast', () => {
		const user: GlobalWpcomUser = { ID: 99999, login: 'bobsacramento', avatar: false };

		const id: number | undefined = user.ID;
		const login: string | undefined = user.login;

		expect( { id, login } ).toEqual( { id: 99999, login: 'bobsacramento' } );
	} );

	test( 'rejects the `Id` misspelling instead of resolving it to unknown', () => {
		const user: GlobalWpcomUser = { ID: 99999, avatar: false };

		// @ts-expect-error WordPress.com spells it `ID`. This has to stay a compile
		// error: an index signature typed `unknown` would resolve `Id` and hide it.
		const misspelled = user.Id;

		expect( misspelled ).toBeUndefined();
	} );

	test( 'rejects any other undeclared field, so the shape stays closed', () => {
		const user: GlobalWpcomUser = { avatar: false };

		// @ts-expect-error `userEmail` is not a field WordPress.com returns, and
		// there is no index signature to absorb it.
		const undeclared = user.userEmail;

		expect( undeclared ).toBeUndefined();
	} );

	test( 'types avatar as a URL or false, never as a boolean', () => {
		const user: GlobalWpcomUser = { avatar: 'https://example.com/avatar.png' };

		const avatar: string | false = user.avatar;

		// @ts-expect-error `avatar` is `string | false`. The superseded `boolean`
		// declaration accepted this assignment, so the directive going unused is
		// what would tell us the widening had been reverted.
		const asBoolean: boolean = user.avatar;

		expect( asBoolean ).toBe( avatar );
	} );

	test( 'requires avatar, the one field the PHP always sets', () => {
		// @ts-expect-error `avatar` is required: `get_user_connection_data()` sets it
		// unconditionally, so even with no connected WordPress.com user the object is
		// `{ avatar: false }` rather than empty. Every other field is optional, which
		// leaves this the only assertion pinning that asymmetry.
		const user: GlobalWpcomUser = {};

		expect( user ).toEqual( {} );
	} );

	test( 'no longer accepts the `true` that the boolean declaration allowed', () => {
		// @ts-expect-error `avatar` is a URL or `false`; `get_avatar_url()` never
		// returns `true`, which the superseded `boolean` declaration permitted.
		const user: GlobalWpcomUser = { avatar: true };

		expect( user.avatar ).toBe( true );
	} );
} );
