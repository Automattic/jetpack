import { classifyChanges } from '../../../helpers/lastBuilt.js';

describe( 'lastBuilt.classifyChanges', () => {
	test( 'empty/null file list marks none', () => {
		expect( classifyChanges( [] ).none ).toBe( true );
		expect( classifyChanges( null ).none ).toBe( true );
	} );

	test( 'php-only change → phpAutoload', () => {
		const buckets = classifyChanges( [ 'projects/packages/foo/src/Foo.php' ] );
		expect( buckets.phpAutoload ).toBe( true );
		expect( buckets.composerRequire ).toBe( false );
		expect( buckets.jsSources ).toBe( false );
	} );

	test( 'composer.json change → composerRequire', () => {
		const buckets = classifyChanges( [ 'projects/packages/foo/composer.json' ] );
		expect( buckets.composerRequire ).toBe( true );
	} );

	test( 'composer.lock change → composerRequire', () => {
		const buckets = classifyChanges( [ 'projects/plugins/jetpack/composer.lock' ] );
		expect( buckets.composerRequire ).toBe( true );
	} );

	test( 'package.json change → jsDeps', () => {
		const buckets = classifyChanges( [ 'projects/js-packages/foo/package.json' ] );
		expect( buckets.jsDeps ).toBe( true );
	} );

	test( 'JS/TS/SCSS source → jsSources', () => {
		const buckets = classifyChanges( [
			'projects/packages/foo/src/index.ts',
			'projects/packages/foo/src/style.scss',
			'projects/packages/foo/src/component.jsx',
		] );
		expect( buckets.jsSources ).toBe( true );
		expect( buckets.phpAutoload ).toBe( false );
	} );

	test( 'mixed PHP and JS sources set both flags', () => {
		const buckets = classifyChanges( [
			'projects/plugins/jetpack/_inc/lib/foo.php',
			'projects/plugins/jetpack/_inc/client/index.tsx',
		] );
		expect( buckets.phpAutoload ).toBe( true );
		expect( buckets.jsSources ).toBe( true );
	} );

	test( 'docs/markdown changes → other only', () => {
		const buckets = classifyChanges( [
			'projects/packages/foo/README.md',
			'projects/packages/foo/CHANGELOG.md',
		] );
		expect( buckets.other ).toBe( true );
		expect( buckets.phpAutoload ).toBe( false );
		expect( buckets.composerRequire ).toBe( false );
		expect( buckets.jsSources ).toBe( false );
		expect( buckets.jsDeps ).toBe( false );
	} );

	test( 'webpack config change → jsSources', () => {
		const buckets = classifyChanges( [ 'projects/plugins/jetpack/webpack.config.js' ] );
		expect( buckets.jsSources ).toBe( true );
	} );
} );
