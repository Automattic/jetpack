import { findDashboardFrame } from '../dashboard-frame';

const base =
	'https://example.com/wp-content/plugins/jetpack/jetpack_vendor/automattic/jetpack-premium-analytics/build/';
const origins = [ base ];

describe( 'findDashboardFrame', () => {
	it( 'returns the first frame under an allowlisted origin', () => {
		const stack = [
			'Error: boom',
			'    at helper (https://example.com/wp-includes/js/other.min.js:1:2)',
			`    at render (${ base }routes/dashboard/content.min.js:12:345)`,
			`    at later (${ base }routes/other/content.min.js:1:1)`,
		].join( '\n' );

		expect( findDashboardFrame( stack, origins )?.path ).toBe( 'routes/dashboard/content.min.js' );
	} );

	it( 'parses the line and column of that frame', () => {
		const stack = `Error: boom\n    at render (${ base }routes/dashboard/content.min.js:12:345)`;

		expect( findDashboardFrame( stack, origins ) ).toMatchObject( {
			url: `${ base }routes/dashboard/content.min.js:12:345`,
			line: 12,
			column: 345,
		} );
	} );

	it( 'reads the widget name from a widgets/<name>/ path', () => {
		const stack = `Error: boom\n    at render (${ base }widgets/top-posts/render.min.js:3:4)`;

		expect( findDashboardFrame( stack, origins )?.widget ).toBe( 'top-posts' );
	} );

	it( 'leaves widget undefined for a route frame', () => {
		const stack = `Error: boom\n    at render (${ base }routes/dashboard/content.min.js:3:4)`;

		expect( findDashboardFrame( stack, origins )?.widget ).toBeUndefined();
	} );

	it( 'returns null when no frame is under an allowlisted origin', () => {
		const stack = 'Error: boom\n    at x (https://example.com/wp-includes/js/other.min.js:1:2)';

		expect( findDashboardFrame( stack, origins ) ).toBeNull();
	} );

	it( 'returns null for an undefined stack', () => {
		expect( findDashboardFrame( undefined, origins ) ).toBeNull();
	} );

	it( 'returns null for an empty origin list', () => {
		const stack = `Error: boom\n    at render (${ base }routes/dashboard/content.min.js:3:4)`;

		expect( findDashboardFrame( stack, [] ) ).toBeNull();
	} );

	it( 'ignores an error message that contains a dashboard URL', () => {
		const stack = [
			`Error: Failed to fetch dynamically imported module: ${ origins[ 0 ] }routes/dashboard/content.min.js`,
			'    at https://example.com/wp-includes/js/other.min.js:1:2',
		].join( '\n' );

		expect( findDashboardFrame( stack, origins ) ).toBeNull();
	} );

	it( 'returns null when the origin list is absent', () => {
		const stack = `Error: boom\n    at render (${ base }routes/dashboard/content.min.js:3:4)`;

		expect( findDashboardFrame( stack, undefined ) ).toBeNull();
	} );

	it( 'returns null when an origin is an empty string', () => {
		const stack = 'Error: boom\n    at x (https://example.com/wp-includes/js/other.min.js:1:2)';

		expect( findDashboardFrame( stack, [ '' ] ) ).toBeNull();
	} );

	it( 'parses a Firefox-style frame', () => {
		const stack = `fn@${ base }widgets/x/render.min.js:4:9\nother@https://example.com/a.js:1:1`;

		expect( findDashboardFrame( stack, origins ) ).toEqual( {
			url: `${ base }widgets/x/render.min.js:4:9`,
			path: 'widgets/x/render.min.js',
			widget: 'x',
			line: 4,
			column: 9,
		} );
	} );

	it( 'parses a Safari module code frame', () => {
		const stack = [
			'fn@https://example.com/wp-includes/js/other.min.js:1:2',
			`module code@${ origins[ 0 ] }routes/dashboard/content.min.js:3:7`,
		].join( '\n' );

		expect( findDashboardFrame( stack, origins ) ).toEqual( {
			url: `${ origins[ 0 ] }routes/dashboard/content.min.js:3:7`,
			path: 'routes/dashboard/content.min.js',
			widget: undefined,
			line: 3,
			column: 7,
		} );
	} );

	it( 'strips a query string from the path', () => {
		const stack = `Error: boom\n    at fn (${ base }widgets/x/render.min.js?ver=1:5:6)`;

		expect( findDashboardFrame( stack, origins )?.path ).toBe( 'widgets/x/render.min.js' );
	} );
} );
