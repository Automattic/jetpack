import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';
import mergeDirs from '../../../helpers/mergeDirs.js';

const dataDir = fileURLToPath( new URL( '../../data/', import.meta.url ) );
const sourceDir = path.join( dataDir, 'source/' );
const destDir = path.join( dataDir, 'dest/' );

// Reset test directories before running anything in the event of some left from earlier.
beforeAll( () => {
	try {
		fs.rmSync( destDir, { force: true, recursive: true } );
	} catch ( e ) {
		console.log( 'Deletion of previous tests failed: ' + e.message );
	}
} );

// Reset after each test to ensure clean merge testing.
afterEach( () => {
	try {
		fs.rmSync( destDir, { force: true, recursive: true } );
	} catch ( e ) {
		console.log( 'Deletion of previous test failed: ' + e.message );
	}
} );

describe( 'mergeDirs', () => {
	test( 'should be a function', () => {
		expect( mergeDirs ).toBeInstanceOf( Function );
	} );

	test( 'should fail when both a src and dist is not passed', () => {
		expect( () => mergeDirs() ).toThrow();
	} );

	test( 'should copy directory to a new location', () => {
		mergeDirs( sourceDir, destDir );
		expect( fs.existsSync( dataDir + 'source/source.md' ) ).toBe( true );
	} );

	test( 'should bail by default if a file already exists', () => {
		const consoleWarnMock = jest.spyOn( console, 'warn' ).mockImplementation();
		mergeDirs( sourceDir, destDir ); // initial write
		mergeDirs( sourceDir, destDir ); // should refuse to overwrite the same files
		expect( console.warn ).toHaveBeenCalledWith(
			expect.stringContaining( 'source.md exists, skipping...' )
		);
		consoleWarnMock.mockRestore();
	} );
} );
