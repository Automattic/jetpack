import { extractMissingSymbols } from '../../../helpers/logScan.js';

describe( 'logScan.extractMissingSymbols', () => {
	test( 'returns empty array for empty input', () => {
		expect( extractMissingSymbols( '' ) ).toEqual( [] );
		expect( extractMissingSymbols( null ) ).toEqual( [] );
	} );

	test( 'extracts FQN from PHP 8 "Class not found" fatal', () => {
		const log = `[28-May-2026 14:32:01 UTC] PHP Fatal error:  Uncaught Error: Class "Automattic\\Jetpack\\Foo\\Bar" not found in /var/www/html/wp-content/plugins/jetpack/jetpack.php:42`;
		expect( extractMissingSymbols( log ) ).toEqual( [ 'Automattic\\Jetpack\\Foo\\Bar' ] );
	} );

	test( 'extracts Interface and Trait fatals as well', () => {
		const log = [
			`PHP Fatal error:  Uncaught Error: Interface "A\\B\\IFoo" not found in /x.php:1`,
			`PHP Fatal error:  Uncaught Error: Trait "A\\B\\TBar" not found in /x.php:1`,
		].join( '\n' );
		const result = extractMissingSymbols( log );
		expect( result.sort() ).toEqual( [ 'A\\B\\IFoo', 'A\\B\\TBar' ].sort() );
	} );

	test( 'extracts PHP 7 phrasing without quotes', () => {
		const log = `PHP Fatal error: Class Automattic\\Jetpack\\Old\\Thing not found in /x.php:1`;
		expect( extractMissingSymbols( log ) ).toEqual( [ 'Automattic\\Jetpack\\Old\\Thing' ] );
	} );

	test( 'strips leading backslash', () => {
		const log = `PHP Fatal error:  Uncaught Error: Class "\\Automattic\\Jetpack\\X" not found in /x.php:1`;
		expect( extractMissingSymbols( log ) ).toEqual( [ 'Automattic\\Jetpack\\X' ] );
	} );

	test( 'deduplicates repeated FQNs', () => {
		const log = [
			`PHP Fatal error: Uncaught Error: Class "X\\Y\\Z" not found in /a.php:1`,
			`PHP Fatal error: Uncaught Error: Class "X\\Y\\Z" not found in /b.php:2`,
		].join( '\n' );
		expect( extractMissingSymbols( log ) ).toEqual( [ 'X\\Y\\Z' ] );
	} );

	test( 'returns newest fatal first when multiple distinct FQNs appear', () => {
		const log = [
			`[01] PHP Fatal error: Uncaught Error: Class "A\\First" not found in /a.php:1`,
			`some other log line`,
			`[02] PHP Fatal error: Uncaught Error: Class "A\\Second" not found in /a.php:1`,
		].join( '\n' );
		// The later occurrence ("Second") has a higher index — should be first in the result.
		expect( extractMissingSymbols( log ) ).toEqual( [ 'A\\Second', 'A\\First' ] );
	} );

	test( 'ignores unrelated error messages', () => {
		const log = [
			`PHP Notice:  Undefined index: foo in /x.php on line 1`,
			`PHP Warning:  count(): Parameter must be an array in /x.php on line 1`,
			`PHP Fatal error:  Uncaught TypeError: Argument 1 passed to f() must be of the type string`,
		].join( '\n' );
		expect( extractMissingSymbols( log ) ).toEqual( [] );
	} );
} );
