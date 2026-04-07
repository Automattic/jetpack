import fs from 'fs';
import os from 'os';
import path from 'path';
import { safeReadFileSync, safeJsonParse } from '../src/utils/safe-read-file.ts';

describe( 'safeReadFileSync', () => {
	let tmpDir: string;

	beforeEach( () => {
		tmpDir = fs.mkdtempSync( path.join( os.tmpdir(), 'safe-read-test-' ) );
	} );

	afterEach( () => {
		fs.rmSync( tmpDir, { recursive: true, force: true } );
	} );

	test( 'reads a normal file within the boundary', () => {
		const filePath = path.join( tmpDir, 'file.json' );
		fs.writeFileSync( filePath, '{"key":"value"}' );
		const result = safeReadFileSync( filePath, tmpDir );
		expect( result ).toBe( '{"key":"value"}' );
	} );

	test( 'rejects a symlink', () => {
		const realFile = path.join( tmpDir, 'real.json' );
		const linkFile = path.join( tmpDir, 'link.json' );
		fs.writeFileSync( realFile, '{"key":"value"}' );
		fs.symlinkSync( realFile, linkFile );
		expect( () => safeReadFileSync( linkFile, tmpDir ) ).toThrow( 'Refusing to read symlink' );
	} );

	test( 'rejects a path that resolves outside the boundary', () => {
		const outsideDir = fs.mkdtempSync( path.join( os.tmpdir(), 'safe-read-outside-' ) );
		const outsideFile = path.join( outsideDir, 'secret.txt' );
		fs.writeFileSync( outsideFile, 'secret-content' );
		try {
			expect( () => safeReadFileSync( outsideFile, tmpDir ) ).toThrow(
				'Path escapes workspace boundary'
			);
		} finally {
			fs.rmSync( outsideDir, { recursive: true, force: true } );
		}
	} );

	test( 'rejects a symlinked intermediate directory', () => {
		const realSubdir = path.join( tmpDir, 'real-subdir' );
		fs.mkdirSync( realSubdir );
		fs.writeFileSync( path.join( realSubdir, 'file.json' ), '{}' );

		const outsideDir = fs.mkdtempSync( path.join( os.tmpdir(), 'safe-read-outside-' ) );
		fs.writeFileSync( path.join( outsideDir, 'file.json' ), 'leaked' );

		const linkedSubdir = path.join( tmpDir, 'linked-subdir' );
		fs.symlinkSync( outsideDir, linkedSubdir );

		try {
			expect( () => safeReadFileSync( path.join( linkedSubdir, 'file.json' ), tmpDir ) ).toThrow(
				'Path escapes workspace boundary'
			);
		} finally {
			fs.rmSync( outsideDir, { recursive: true, force: true } );
		}
	} );
} );

describe( 'safeJsonParse', () => {
	test( 'parses valid JSON', () => {
		const result = safeJsonParse( '{"key":"value"}', 'test.json' );
		expect( result ).toEqual( { key: 'value' } );
	} );

	test( 'throws sanitized error for invalid JSON', () => {
		expect( () => safeJsonParse( 'SECRET_KEY=abc123', 'composer.json' ) ).toThrow(
			/^Invalid JSON in composer\.json$/
		);
	} );
} );
