// The package builds no `@types/node`, and consumers compiling `src` through
// `jetpack:src` would fail on a bare `process.env` — see AGENTS.md.
declare const process: { env: Record< string, string | undefined > };

/**
 * Runs this file's tests in a time zone other than the one the test script pins.
 *
 * `TZ=UTC` is what hid every time-zone bug in the date formatters: it makes "the
 * viewer's zone" and "the data's zone" the same thing, so a test asserting a
 * host-supplied zone under it proves nothing. Node re-reads `process.env.TZ` on
 * every `Date` and `Intl` operation, so setting it here is enough.
 *
 * @param timeZone - IANA zone the tests in this file run in.
 */
export const runTestsInTimeZone = ( timeZone: string ) => {
	const pinned = process.env.TZ;

	beforeAll( () => {
		process.env.TZ = timeZone;
	} );

	afterAll( () => {
		process.env.TZ = pinned;
	} );
};
