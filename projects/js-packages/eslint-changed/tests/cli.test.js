import childProcess from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';
import { createProgram } from '../src/cli.js';

const dirname = fileURLToPath( new URL( './', import.meta.url ) );

jest.setTimeout( 5000 );

describe( 'bin/eslint-changed.js', () => {
	let tmpdir = null;

	expect.extend( {
		toBeValidJSON( received ) {
			const options = {
				isNot: this.isNot,
				promise: this.promise,
			};

			try {
				JSON.parse( received );
			} catch ( e ) {
				return {
					message: () =>
						this.utils.matcherHint( 'toBeValidJSON', undefined, '', options ) +
						// prettier-ignore
						`\n\nJSON parse failed: ${ e.message }\nReceived: ${ this.utils.printReceived( received ) }`,
					pass: false,
				};
			}

			return {
				message: () =>
					this.utils.matcherHint( 'toBeValidJSON', undefined, '', options ) +
					`\n\nReceived: ${ this.utils.printReceived( received ) }`,
				pass: true,
			};
		},
	} );

	/**
	 * Run eslint-changed.
	 *
	 * @param {string[]} args      - Arguments to pass.
	 * @param {object}   [options] - Process options.
	 * @return {object} data - Process data.
	 */
	async function runEslintChanged( args, options = {} ) {
		const proc = {
			cwd: () => process.cwd(),
			env: {
				...process.env,
				...options.env,
			},
			exitCode: 0,
		};
		let stdout = '',
			stderr = '',
			error = null;

		const oldpwd = process.cwd();
		if ( options.cwd ) {
			process.chdir( options.cwd );
		}
		try {
			const program = createProgram( proc );
			program.exitOverride();
			program.configureOutput( {
				writeOut: s => ( stdout += s ),
				writeErr: s => ( stderr += s ),
			} );
			await program.parseAsync( [ ...process.argv.slice( 0, 2 ), ...args ] ).catch( e => {
				error = e;
				proc.exitCode = e.exitCode ?? 1;
			} );
		} finally {
			process.chdir( oldpwd );
		}

		return {
			exitCode: proc.exitCode,
			error,
			stdout,
			stderr,
		};
	}

	/**
	 * Set up a temporary directory.
	 *
	 * The path is stored in `tmpdir`.
	 */
	async function mktmpdir() {
		if ( tmpdir ) {
			await fs.rm( tmpdir, { force: true, recursive: true } );
			tmpdir = null;
		}
		const parentTmpdir = await fs.realpath( os.tmpdir() );
		tmpdir = await fs.mkdtemp( path.join( parentTmpdir, 'eslint-changed-test-' ) );
	}

	// Clean up after each test.
	afterEach( async () => {
		// Clean up the temporary directory, if any.
		if ( tmpdir ) {
			await fs.rm( tmpdir, { force: true, recursive: true } );
			tmpdir = null;
		}
	} );

	test( 'Accepts --version', async () => {
		const data = await runEslintChanged( [ '--version' ] );
		expect( data.exitCode ).toBe( 0 );
		expect( data.stdout ).toMatch( /^\d+\.\d+\.\d+(?:-alpha)?\n$/s );
	} );

	test( 'Fails when not passed --diff or --git', async () => {
		const data = await runEslintChanged( [] );
		expect( data.exitCode ).toBe( 1 );
	} );

	test( 'Fails when passed both --diff and --git', async () => {
		const data = await runEslintChanged( [ '--git', '--diff', 'foo' ] );
		expect( data.exitCode ).toBe( 1 );
	} );

	describe( 'Manual mode', () => {
		test( 'Works in manual mode', async () => {
			const data = await runEslintChanged( [
				'--format=json',
				'--diff',
				path.join( dirname, 'fixtures/manual-mode.diff' ),
				'--diff-base',
				'/tmp/x/t',
				'--eslint-orig',
				path.join( dirname, 'fixtures/manual-mode.orig.json' ),
				'--eslint-new',
				path.join( dirname, 'fixtures/manual-mode.new.json' ),
			] );
			expect( data.exitCode ).toBe( 1 );

			expect( data.stdout ).toBeValidJSON();
			const output = JSON.parse( data.stdout );
			expect( output ).toBeInstanceOf( Array );
			const expectOutput = JSON.parse(
				await fs.readFile( path.join( dirname, 'fixtures/manual-mode.expect.json' ) )
			);
			expect( output ).toEqual( expectOutput );
		} );

		test( 'Exit 0 when no new errors', async () => {
			const data = await runEslintChanged( [
				'--format=json',
				'--diff',
				path.join( dirname, 'fixtures/no-new-errors.diff' ),
				'--diff-base',
				'/tmp/x/t',
				'--eslint-orig',
				path.join( dirname, 'fixtures/no-new-errors.orig.json' ),
				'--eslint-new',
				path.join( dirname, 'fixtures/no-new-errors.new.json' ),
			] );
			expect( data.exitCode ).toBe( 0 );

			expect( data.stdout ).toBeValidJSON();
			const output = JSON.parse( data.stdout );
			expect( output ).toBeInstanceOf( Array );
			const expectOutput = JSON.parse(
				await fs.readFile( path.join( dirname, 'fixtures/no-new-errors.expect.json' ) )
			);
			expect( output ).toEqual( expectOutput );
		} );

		test( 'Filters by filename', async () => {
			const data = await runEslintChanged( [
				'--format=json',
				'--diff',
				path.join( dirname, 'fixtures/files-123.diff' ),
				'--diff-base',
				'/tmp/x/t',
				'--eslint-orig',
				path.join( dirname, 'fixtures/files-123.orig.json' ),
				'--eslint-new',
				path.join( dirname, 'fixtures/files-123.new.json' ),
				'1.js',
				'3.js',
			] );
			expect( data.exitCode ).toBe( 1 );

			expect( data.stdout ).toBeValidJSON();
			const output = JSON.parse( data.stdout );
			expect( output ).toBeInstanceOf( Array );
			const expectOutput = JSON.parse(
				await fs.readFile( path.join( dirname, 'fixtures/files-123.expect.json' ) )
			);
			expect( output ).toEqual( expectOutput );
		} );

		test( 'Filters by filename with --in-diff-only', async () => {
			const data = await runEslintChanged( [
				'--format=json',
				'--in-diff-only',
				'--diff',
				path.join( dirname, 'fixtures/files-123.diff' ),
				'--diff-base',
				'/tmp/x/t',
				'--eslint-orig',
				path.join( dirname, 'fixtures/files-123.orig.json' ),
				'--eslint-new',
				path.join( dirname, 'fixtures/files-123.new.json' ),
				'1.js',
				'3.js',
			] );
			expect( data.exitCode ).toBe( 1 );

			expect( data.stdout ).toBeValidJSON();
			const output = JSON.parse( data.stdout );
			expect( output ).toBeInstanceOf( Array );
			const expectOutput = JSON.parse(
				await fs.readFile( path.join( dirname, 'fixtures/files-123.expect2.json' ) )
			);
			expect( output ).toEqual( expectOutput );
		} );

		test( 'Includes new errors in unchanged lines', async () => {
			const data = await runEslintChanged( [
				'--format=json',
				'--diff',
				path.join( dirname, 'fixtures/new-err-not-in-diff.diff' ),
				'--diff-base',
				'/tmp/x/t',
				'--eslint-orig',
				path.join( dirname, 'fixtures/new-err-not-in-diff.orig.json' ),
				'--eslint-new',
				path.join( dirname, 'fixtures/new-err-not-in-diff.new.json' ),
			] );
			expect( data.exitCode ).toBe( 1 );

			expect( data.stdout ).toBeValidJSON();
			const output = JSON.parse( data.stdout );
			expect( output ).toBeInstanceOf( Array );
			const expectOutput = JSON.parse(
				await fs.readFile( path.join( dirname, 'fixtures/new-err-not-in-diff.expect.json' ) )
			);
			expect( output ).toEqual( expectOutput );
		} );

		test( 'Does not include new errors in unchanged lines with --in-diff-only', async () => {
			const data = await runEslintChanged( [
				'--format=json',
				'--in-diff-only',
				'--diff',
				path.join( dirname, 'fixtures/new-err-not-in-diff.diff' ),
				'--diff-base',
				'/tmp/x/t',
				'--eslint-orig',
				path.join( dirname, 'fixtures/new-err-not-in-diff.orig.json' ),
				'--eslint-new',
				path.join( dirname, 'fixtures/new-err-not-in-diff.new.json' ),
			] );
			expect( data.exitCode ).toBe( 0 );

			expect( data.stdout ).toBeValidJSON();
			const output = JSON.parse( data.stdout );
			expect( output ).toBeInstanceOf( Array );
			const expectOutput = JSON.parse(
				await fs.readFile( path.join( dirname, 'fixtures/new-err-not-in-diff.expect2.json' ) )
			);
			expect( output ).toEqual( expectOutput );
		} );

		test( 'Gets diff-base from cwd', async () => {
			await mktmpdir();

			for ( const suffix of [ 'diff', 'orig.json', 'new.json', 'expect.json' ] ) {
				const data = await fs.readFile(
					path.join( dirname, `fixtures/manual-mode.${ suffix }` ),
					'utf-8'
				);
				await fs.writeFile(
					path.join( tmpdir, `test.${ suffix }` ),
					data.replace( /\/tmp\/x\/t\//g, tmpdir + '/' )
				);
			}

			const data = await runEslintChanged(
				[
					'--format=json',
					'--diff',
					'test.diff',
					'--eslint-orig',
					'test.orig.json',
					'--eslint-new',
					'test.new.json',
				],
				{ cwd: tmpdir }
			);
			expect( data.exitCode ).toBe( 1 );

			expect( data.stdout ).toBeValidJSON();
			const output = JSON.parse( data.stdout );
			expect( output ).toBeInstanceOf( Array );
			const expectOutput = JSON.parse(
				await fs.readFile( path.join( tmpdir, 'test.expect.json' ) )
			);
			expect( output ).toEqual( expectOutput );
		} );

		const argsets = [
			[ '--diff', path.join( dirname, 'fixtures/no-new-errors.diff' ) ],
			[ '--eslint-orig', path.join( dirname, 'fixtures/no-new-errors.orig.json' ) ],
			[ '--eslint-new', path.join( dirname, 'fixtures/no-new-errors.new.json' ) ],
		];
		// eslint-disable-next-line no-bitwise
		for ( let i = ( 1 << argsets.length ) - 2; i > 0; i-- ) {
			const args = [];
			const missing = [];
			for ( let j = 0; j < argsets.length; j++ ) {
				// eslint-disable-next-line no-bitwise
				if ( i & ( 1 << j ) ) {
					args.push( ...argsets[ j ] );
				} else {
					missing.push( argsets[ j ][ 0 ] );
				}
			}

			test( `Fails with incomplete arguments: missing ${ missing.join( ' ' ) }`, async () => {
				const data = await runEslintChanged( [ '--format=json', ...args ] );
				expect( data.exitCode ).toBe( 1 );
			} );
		}
	} );

	describe( 'Git mode', function () {
		// Apparently eslint deprecated a bunch of rules still in eslint:recommended.
		const usedDeprecatedRules = [
			{
				info: {
					availableUntil: '10.0.0',
					deprecatedSince: '8.53.0',
					message: 'Formatting rules are being moved out of ESLint core.',
					replacedBy: [
						{
							message: 'ESLint Stylistic now maintains deprecated stylistic core rules.',
							plugin: {
								name: '@stylistic/eslint-plugin-js',
								url: 'https://eslint.style/packages/js',
							},
							rule: {
								name: 'quotes',
								url: 'https://eslint.style/rules/js/quotes',
							},
							url: 'https://eslint.style/guide/migration',
						},
					],
					url: 'https://eslint.org/blog/2023/10/deprecating-formatting-rules/',
				},
				replacedBy: [ '@stylistic/js/quotes' ],
				ruleId: 'quotes',
			},
			{
				info: {
					availableUntil: '10.0.0',
					deprecatedSince: '8.53.0',
					message: 'Formatting rules are being moved out of ESLint core.',
					replacedBy: [
						{
							message: 'ESLint Stylistic now maintains deprecated stylistic core rules.',
							plugin: {
								name: '@stylistic/eslint-plugin-js',
								url: 'https://eslint.style/packages/js',
							},
							rule: {
								name: 'semi',
								url: 'https://eslint.style/rules/js/semi',
							},
							url: 'https://eslint.style/guide/migration',
						},
					],
					url: 'https://eslint.org/blog/2023/10/deprecating-formatting-rules/',
				},
				replacedBy: [ '@stylistic/js/semi' ],
				ruleId: 'semi',
			},
		];

		/**
		 * Set up a temporary directory with a git repo.
		 *
		 * The path is stored in `tmpdir`.
		 *
		 * @param {object[]}                      branches          - An array of branches to create.
		 * @param {string}                        [branches.name]   - Name of the branch.
		 * @param {string}                        [branches.parent] - Name of the parent branch. If omitted, the parent is the previous entry in the array. Must be omitted in the first entry.
		 * @param {Object<string, string | null>} branches.files    - Files to modify, and their contents (or null to delete the file).
		 * @param {Object<string, string | null>} [staged]          - Files to modify and stage.
		 * @param {Object<string, string | null>} [unstaged]        - Files to modify and leave unstaged.
		 */
		async function mktmpdirgit( branches, staged, unstaged ) {
			await mktmpdir();

			const opts = {
				cwd: tmpdir,
				env: {
					GIT_CONFIG_GLOBAL: '/dev/null',
					GIT_AUTHOR_NAME: 'Testing',
					GIT_AUTHOR_EMAIL: 'nobody@example.com',
					GIT_COMMITTER_NAME: 'Testing',
					GIT_COMMITTER_EMAIL: 'nobody@example.com',
				},
			};
			childProcess.spawnSync( 'git', [ 'init', '.' ], opts );

			/**
			 * Modify files.
			 *
			 * @param {Object<string, string | null>} files - Files to modify, and their contents (or null to delete the file).
			 * @param {boolean}                       git   - Whether to do git manipulations.
			 */
			async function doFiles( files, git ) {
				const modified = [];
				const removed = [];

				for ( const [ fileName, contents ] of Object.entries( files ) ) {
					const filePath = path.join( tmpdir, fileName );

					if ( contents === null ) {
						await fs.rm( filePath, { force: true, recursive: true } );
						removed.push( fileName );
					} else {
						await fs.mkdir( path.dirname( filePath ), { recursive: true } );
						await fs.writeFile( filePath, contents );
						modified.push( fileName );
					}
				}

				if ( git && removed.length ) {
					childProcess.spawnSync( 'git', [ 'rm', '-f', ...removed ], opts );
				}
				if ( git && modified.length ) {
					childProcess.spawnSync( 'git', [ 'add', '-f', ...modified ], opts );
				}
			}

			for ( const b of branches ) {
				if ( b.parent ) {
					childProcess.spawnSync( 'git', [ 'checkout', b.parent ], opts );
				}
				if ( b.name ) {
					childProcess.spawnSync( 'git', [ 'checkout', '-B', b.name ], opts );
				} else {
					childProcess.spawnSync( 'git', [ 'checkout', '--detach' ], opts );
				}
				await doFiles( b.files, true );
				childProcess.spawnSync( 'git', [ 'commit', '-m', 'Testing' ], opts );
			}

			if ( staged ) {
				await doFiles( staged, true );
			}
			if ( unstaged ) {
				await doFiles( unstaged, false );
			}
		}

		const eslintconfig =
			'export default ' +
			JSON.stringify( [
				{
					languageOptions: {
						globals: {
							console: 'readonly',
						},
					},
					rules: {
						'no-unused-vars': 'error',
						'no-undef': 'error',
						quotes: [ 'error', 'single' ],
						semi: [ 'error', 'always' ],
					},
				},
			] ) +
			';';

		const standardRepo = [
			[
				{
					name: 'base',
					files: {
						'eslint.config.mjs': eslintconfig,
						'1.js': "console.log( 'Hello, world!' );\n",
						'2.js': "console.log( 'Hello, world!' );\n",
						'3.js': "console.log( 'Hello, world!' );\n",
					},
				},
				{
					name: 'trunk',
					files: {
						'1.js': "var x;\nconsole.log( 'Hello, world!' );\n",
					},
				},
			],
			{
				'2.js': 'console.log( "Hello, world?" );\n',
			},
			{
				'3.js': "console.log( '¡Hola, mundo!' )\n",
			},
		];

		test( 'Fails gracefully without git', async () => {
			const data = await runEslintChanged( [ '--format=json', '--git' ], {
				cwd: tmpdir,
				env: { GIT: 'this-command-really-should-not-exist' },
			} );
			expect( data.exitCode ).toBe( 1 );
			expect( data.stderr ).toBe(
				'error: failed to execute git as `this-command-really-should-not-exist`. Use environment variable `GIT` to override.\n'
			);
		} );

		test( 'Works in git mode, --git-staged is the default', async () => {
			await mktmpdirgit( ...standardRepo );

			const data = await runEslintChanged( [ '--format=json', '--git' ], { cwd: tmpdir } );
			expect( data.exitCode ).toBe( 1 );

			expect( data.stdout ).toBeValidJSON();
			const output = JSON.parse( data.stdout );
			expect( output ).toBeInstanceOf( Array );
			const expectOutput = [
				{
					filePath: path.join( tmpdir, '2.js' ),
					messages: [
						{
							ruleId: 'quotes',
							severity: 2,
							message: 'Strings must use singlequote.',
							line: 1,
							column: 14,
							nodeType: 'Literal',
							messageId: 'wrongQuotes',
							endLine: 1,
							endColumn: 29,
							fix: {
								range: [ 13, 28 ],
								text: "'Hello, world?'",
							},
						},
					],
					errorCount: 1,
					fatalErrorCount: 0,
					warningCount: 0,
					fixableErrorCount: 1,
					fixableWarningCount: 0,
					source: 'console.log( "Hello, world?" );\n',
					suppressedMessages: [],
					usedDeprecatedRules,
				},
			];
			expect( output ).toEqual( expectOutput );
		} );

		test( 'Works in git mode, explicit --git-staged', async () => {
			await mktmpdirgit( ...standardRepo );

			const data = await runEslintChanged( [ '--format=json', '--git', '--git-staged' ], {
				cwd: tmpdir,
			} );
			expect( data.exitCode ).toBe( 1 );

			expect( data.stdout ).toBeValidJSON();
			const output = JSON.parse( data.stdout );
			expect( output ).toBeInstanceOf( Array );
			const expectOutput = [
				{
					filePath: path.join( tmpdir, '2.js' ),
					messages: [
						{
							ruleId: 'quotes',
							severity: 2,
							message: 'Strings must use singlequote.',
							line: 1,
							column: 14,
							nodeType: 'Literal',
							messageId: 'wrongQuotes',
							endLine: 1,
							endColumn: 29,
							fix: {
								range: [ 13, 28 ],
								text: "'Hello, world?'",
							},
						},
					],
					errorCount: 1,
					fatalErrorCount: 0,
					warningCount: 0,
					fixableErrorCount: 1,
					fixableWarningCount: 0,
					source: 'console.log( "Hello, world?" );\n',
					suppressedMessages: [],
					usedDeprecatedRules,
				},
			];
			expect( output ).toEqual( expectOutput );
		} );

		test( 'Works with --git-unstaged', async () => {
			await mktmpdirgit( ...standardRepo );

			const data = await runEslintChanged( [ '--format=json', '--git', '--git-unstaged' ], {
				cwd: tmpdir,
			} );
			expect( data.exitCode ).toBe( 1 );

			expect( data.stdout ).toBeValidJSON();
			const output = JSON.parse( data.stdout );
			expect( output ).toBeInstanceOf( Array );
			const expectOutput = [
				{
					filePath: path.join( tmpdir, '3.js' ),
					messages: [
						{
							ruleId: 'semi',
							severity: 2,
							message: 'Missing semicolon.',
							line: 1,
							column: 31,
							nodeType: 'ExpressionStatement',
							messageId: 'missingSemi',
							endLine: 2,
							endColumn: 1,
							fix: {
								range: [ 30, 30 ],
								text: ';',
							},
						},
					],
					errorCount: 1,
					fatalErrorCount: 0,
					warningCount: 0,
					fixableErrorCount: 1,
					fixableWarningCount: 0,
					source: "console.log( '¡Hola, mundo!' )\n",
					suppressedMessages: [],
					usedDeprecatedRules,
				},
			];
			expect( output ).toEqual( expectOutput );
		} );

		test( 'Works with --git-base', async () => {
			await mktmpdirgit( ...standardRepo );

			const data = await runEslintChanged( [ '--format=json', '--git', '--git-base', 'base' ], {
				cwd: tmpdir,
			} );
			expect( data.exitCode ).toBe( 1 );

			expect( data.stdout ).toBeValidJSON();
			const output = JSON.parse( data.stdout );
			expect( output ).toBeInstanceOf( Array );
			const expectOutput = [
				{
					filePath: path.join( tmpdir, '1.js' ),
					messages: [
						{
							ruleId: 'no-unused-vars',
							severity: 2,
							message: "'x' is defined but never used.",
							line: 1,
							column: 5,
							nodeType: 'Identifier',
							messageId: 'unusedVar',
							endLine: 1,
							endColumn: 6,
							suggestions: [
								{
									data: {
										varName: 'x',
									},
									desc: "Remove unused variable 'x'.",
									fix: {
										range: [ 0, 6 ],
										text: '',
									},
									messageId: 'removeVar',
								},
							],
						},
					],
					errorCount: 1,
					fatalErrorCount: 0,
					warningCount: 0,
					fixableErrorCount: 0,
					fixableWarningCount: 0,
					source: "var x;\nconsole.log( 'Hello, world!' );\n",
					suppressedMessages: [],
					usedDeprecatedRules,
				},
			];
			expect( output ).toEqual( expectOutput );
		} );

		test( 'Works with added and deleted files', async () => {
			await mktmpdirgit(
				[
					{
						files: {
							'eslint.config.mjs': eslintconfig,
							'unchanged.js': "console.log( 'Hello, world!' )\n",
							'modified.js': "var x = 'Hello';\nx += ', world!';\nconsole.log( x );\n",
							'deleted.js': "console.log( 'Hello, world!' )\n",
						},
					},
				],
				{
					'modified.js': 'var x = \'Hello\';\nx += ", world!";\nconsole.log( x );\n',
					'deleted.js': null,
					'added.js': 'var x = 1;\n',
				}
			);

			const data = await runEslintChanged( [ '--format=json', '--git' ], { cwd: tmpdir } );
			expect( data.exitCode ).toBe( 1 );

			expect( data.stdout ).toBeValidJSON();
			const output = JSON.parse( data.stdout );
			expect( output ).toBeInstanceOf( Array );
			const expectOutput = [
				{
					filePath: path.join( tmpdir, 'added.js' ),
					messages: [
						{
							ruleId: 'no-unused-vars',
							severity: 2,
							message: "'x' is assigned a value but never used.",
							line: 1,
							column: 5,
							nodeType: 'Identifier',
							messageId: 'unusedVar',
							endLine: 1,
							endColumn: 6,
							suggestions: [
								{
									data: {
										varName: 'x',
									},
									desc: "Remove unused variable 'x'.",
									fix: {
										range: [ 0, 10 ],
										text: '',
									},
									messageId: 'removeVar',
								},
							],
						},
					],
					errorCount: 1,
					fatalErrorCount: 0,
					warningCount: 0,
					fixableErrorCount: 0,
					fixableWarningCount: 0,
					source: 'var x = 1;\n',
					suppressedMessages: [],
					usedDeprecatedRules,
				},
				{
					filePath: path.join( tmpdir, 'modified.js' ),
					messages: [
						{
							ruleId: 'quotes',
							severity: 2,
							message: 'Strings must use singlequote.',
							line: 2,
							column: 6,
							nodeType: 'Literal',
							messageId: 'wrongQuotes',
							endLine: 2,
							endColumn: 16,
							fix: {
								range: [ 22, 32 ],
								text: "', world!'",
							},
						},
					],
					errorCount: 1,
					fatalErrorCount: 0,
					warningCount: 0,
					fixableErrorCount: 1,
					fixableWarningCount: 0,
					source: 'var x = \'Hello\';\nx += ", world!";\nconsole.log( x );\n',
					suppressedMessages: [],
					usedDeprecatedRules,
				},
			];
			expect( output ).toEqual( expectOutput );
		} );

		test( 'Works with explicitly specified files', async () => {
			await mktmpdirgit(
				[
					{
						files: {
							'eslint.config.mjs': eslintconfig,
							'1.js': "var x = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
							'2.js': "var x = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
							'3.js': "var x = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
						},
					},
				],
				{
					'2.js': "var y = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
					'3.js': "var y = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
				}
			);

			const data = await runEslintChanged( [ '--format=json', '--git', '1.js', '2.js' ], {
				cwd: tmpdir,
			} );
			expect( data.exitCode ).toBe( 1 );

			expect( data.stdout ).toBeValidJSON();
			const output = JSON.parse( data.stdout );
			expect( output ).toBeInstanceOf( Array );
			const expectOutput = [
				{
					filePath: path.join( tmpdir, '1.js' ),
					messages: [],
					errorCount: 0,
					fatalErrorCount: 0,
					warningCount: 0,
					fixableErrorCount: 0,
					fixableWarningCount: 0,
					source: "var x = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
					suppressedMessages: [],
					usedDeprecatedRules,
				},
				{
					filePath: path.join( tmpdir, '2.js' ),
					messages: [
						{
							ruleId: 'no-unused-vars',
							severity: 2,
							message: "'y' is assigned a value but never used.",
							line: 1,
							column: 5,
							nodeType: 'Identifier',
							messageId: 'unusedVar',
							endLine: 1,
							endColumn: 6,
							suggestions: [
								{
									data: {
										varName: 'y',
									},
									desc: "Remove unused variable 'y'.",
									fix: {
										range: [ 0, 24 ],
										text: '',
									},
									messageId: 'removeVar',
								},
							],
						},
						{
							ruleId: 'no-undef',
							severity: 2,
							message: "'x' is not defined.",
							line: 13,
							column: 14,
							nodeType: 'Identifier',
							messageId: 'undef',
							endLine: 13,
							endColumn: 15,
						},
					],
					errorCount: 2,
					fatalErrorCount: 0,
					warningCount: 0,
					fixableErrorCount: 0,
					fixableWarningCount: 0,
					source: "var y = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
					suppressedMessages: [],
					usedDeprecatedRules,
				},
			];
			expect( output ).toEqual( expectOutput );
		} );

		test( 'Works with --in-diff-only', async () => {
			await mktmpdirgit(
				[
					{
						files: {
							'eslint.config.mjs': eslintconfig,
							'1.js': "var x = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
							'2.js': "var x = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
							'3.js': "var x = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
						},
					},
				],
				{
					'2.js': "var y = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
					'3.js': "var y = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
				}
			);

			const data = await runEslintChanged( [ '--format=json', '--git', '--in-diff-only' ], {
				cwd: tmpdir,
			} );
			expect( data.exitCode ).toBe( 1 );

			expect( data.stdout ).toBeValidJSON();
			const output = JSON.parse( data.stdout );
			expect( output ).toBeInstanceOf( Array );
			const expectOutput = [
				{
					filePath: path.join( tmpdir, '2.js' ),
					messages: [
						{
							ruleId: 'no-unused-vars',
							severity: 2,
							message: "'y' is assigned a value but never used.",
							line: 1,
							column: 5,
							nodeType: 'Identifier',
							messageId: 'unusedVar',
							endLine: 1,
							endColumn: 6,
							suggestions: [
								{
									data: {
										varName: 'y',
									},
									desc: "Remove unused variable 'y'.",
									fix: {
										range: [ 0, 24 ],
										text: '',
									},
									messageId: 'removeVar',
								},
							],
						},
					],
					errorCount: 1,
					fatalErrorCount: 0,
					warningCount: 0,
					fixableErrorCount: 0,
					fixableWarningCount: 0,
					source: "var y = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
					suppressedMessages: [],
					usedDeprecatedRules,
				},
				{
					filePath: path.join( tmpdir, '3.js' ),
					messages: [
						{
							ruleId: 'no-unused-vars',
							severity: 2,
							message: "'y' is assigned a value but never used.",
							line: 1,
							column: 5,
							nodeType: 'Identifier',
							messageId: 'unusedVar',
							endLine: 1,
							endColumn: 6,
							suggestions: [
								{
									data: {
										varName: 'y',
									},
									desc: "Remove unused variable 'y'.",
									fix: {
										range: [ 0, 24 ],
										text: '',
									},
									messageId: 'removeVar',
								},
							],
						},
					],
					errorCount: 1,
					fatalErrorCount: 0,
					warningCount: 0,
					fixableErrorCount: 0,
					fixableWarningCount: 0,
					source: "var y = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
					suppressedMessages: [],
					usedDeprecatedRules,
				},
			];
			expect( output ).toEqual( expectOutput );
		} );

		test( 'Works with --in-diff-only and filtered files', async () => {
			await mktmpdirgit(
				[
					{
						files: {
							'eslint.config.mjs': eslintconfig,
							'1.js': "var x = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
							'2.js': "var x = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
							'3.js': "var x = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
						},
					},
				],
				{
					'2.js': "var y = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
					'3.js': "var y = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
				}
			);

			const data = await runEslintChanged(
				[ '--format=json', '--git', '--in-diff-only', '1.js', '2.js' ],
				{
					cwd: tmpdir,
				}
			);
			expect( data.exitCode ).toBe( 1 );

			expect( data.stdout ).toBeValidJSON();
			const output = JSON.parse( data.stdout );
			expect( output ).toBeInstanceOf( Array );
			const expectOutput = [
				{
					filePath: path.join( tmpdir, '2.js' ),
					messages: [
						{
							ruleId: 'no-unused-vars',
							severity: 2,
							message: "'y' is assigned a value but never used.",
							line: 1,
							column: 5,
							nodeType: 'Identifier',
							messageId: 'unusedVar',
							endLine: 1,
							endColumn: 6,
							suggestions: [
								{
									data: {
										varName: 'y',
									},
									desc: "Remove unused variable 'y'.",
									fix: {
										range: [ 0, 24 ],
										text: '',
									},
									messageId: 'removeVar',
								},
							],
						},
					],
					errorCount: 1,
					fatalErrorCount: 0,
					warningCount: 0,
					fixableErrorCount: 0,
					fixableWarningCount: 0,
					source: "var y = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
					suppressedMessages: [],
					usedDeprecatedRules,
				},
			];
			expect( output ).toEqual( expectOutput );
		} );

		describe( '--eslint-options works', () => {
			const eslintOptionsRepo = [
				[
					{
						files: {
							'eslint.config.mjs': 'throw new Error( "bogus" );',
							'real-config.mjs': eslintconfig,
							'2.js': "var x = 'Hello, world!';",
						},
					},
				],
				{
					'2.js': "var y = 'Hello, world!';",
				},
			];
			const expectOutput = [
				{
					filePath: null,
					messages: [
						{
							ruleId: 'no-unused-vars',
							severity: 2,
							message: "'y' is assigned a value but never used.",
							line: 1,
							column: 5,
							nodeType: 'Identifier',
							messageId: 'unusedVar',
							endLine: 1,
							endColumn: 6,
							suggestions: [
								{
									data: {
										varName: 'y',
									},
									desc: "Remove unused variable 'y'.",
									fix: {
										range: [ 0, 24 ],
										text: '',
									},
									messageId: 'removeVar',
								},
							],
						},
					],
					errorCount: 1,
					fatalErrorCount: 0,
					warningCount: 0,
					fixableErrorCount: 0,
					fixableWarningCount: 0,
					source: "var y = 'Hello, world!';",
					suppressedMessages: [],
					usedDeprecatedRules,
				},
			];

			test( 'name=value', async () => {
				await mktmpdirgit( ...eslintOptionsRepo );

				const data = await runEslintChanged(
					[ '--format=json', '--git', '--eslint-options', 'overrideConfigFile=real-config.mjs' ],
					{ cwd: tmpdir }
				);
				expect( data.exitCode ).toBe( 1 );

				expect( data.stdout ).toBeValidJSON();
				const output = JSON.parse( data.stdout );
				expect( output ).toBeInstanceOf( Array );

				expectOutput[ 0 ].filePath = path.join( tmpdir, '2.js' );
				expect( output ).toEqual( expectOutput );
			} );

			test( 'name value', async () => {
				await mktmpdirgit( ...eslintOptionsRepo );

				const data = await runEslintChanged(
					[ '--format=json', '--git', '--eslint-options', 'overrideConfigFile', 'real-config.mjs' ],
					{ cwd: tmpdir }
				);
				expect( data.exitCode ).toBe( 1 );

				expect( data.stdout ).toBeValidJSON();
				const output = JSON.parse( data.stdout );
				expect( output ).toBeInstanceOf( Array );

				expectOutput[ 0 ].filePath = path.join( tmpdir, '2.js' );
				expect( output ).toEqual( expectOutput );
			} );

			test( 'name="value"', async () => {
				await mktmpdirgit( ...eslintOptionsRepo );

				const data = await runEslintChanged(
					[ '--format=json', '--git', '--eslint-options', 'overrideConfigFile="real-config.mjs"' ],
					{ cwd: tmpdir }
				);
				expect( data.exitCode ).toBe( 1 );

				expect( data.stdout ).toBeValidJSON();
				const output = JSON.parse( data.stdout );
				expect( output ).toBeInstanceOf( Array );

				expectOutput[ 0 ].filePath = path.join( tmpdir, '2.js' );
				expect( output ).toEqual( expectOutput );
			} );
		} );

		// If this starts failing in eslint 10+, delete or skip it.
		test( 'Works with .eslintrc', async () => {
			await mktmpdirgit(
				[
					{
						name: 'base',
						files: {
							'.eslintrc': JSON.stringify( {
								env: { node: true },
								rules: {
									'no-unused-vars': 'error',
									'no-undef': 'error',
									quotes: [ 'error', 'single' ],
									semi: [ 'error', 'always' ],
								},
							} ),
							'1.js': "console.log( 'Hello, world!' );\n",
							'2.js': "console.log( 'Hello, world!' );\n",
							'3.js': "console.log( 'Hello, world!' );\n",
						},
					},
					{
						name: 'trunk',
						files: {
							'1.js': "var x;\nconsole.log( 'Hello, world!' );\n",
						},
					},
				],
				{
					'2.js': 'console.log( "Hello, world?" );\n',
				},
				{
					'3.js': "console.log( '¡Hola, mundo!' )\n",
				}
			);

			const oldEnv = process.env.ESLINT_USE_FLAT_CONFIG;
			let data;
			try {
				process.env.ESLINT_USE_FLAT_CONFIG = 'false';
				data = await runEslintChanged( [ '--format=json', '--git' ], {
					cwd: tmpdir,
					env: { ESLINT_USE_FLAT_CONFIG: 'false' },
				} );
			} finally {
				process.env.ESLINT_USE_FLAT_CONFIG = oldEnv;
			}
			expect( data.exitCode ).toBe( 1 );

			expect( data.stdout ).toBeValidJSON();
			const output = JSON.parse( data.stdout );
			expect( output ).toBeInstanceOf( Array );
			const expectOutput = [
				{
					filePath: path.join( tmpdir, '2.js' ),
					messages: [
						{
							ruleId: 'quotes',
							severity: 2,
							message: 'Strings must use singlequote.',
							line: 1,
							column: 14,
							nodeType: 'Literal',
							messageId: 'wrongQuotes',
							endLine: 1,
							endColumn: 29,
							fix: {
								range: [ 13, 28 ],
								text: "'Hello, world?'",
							},
						},
					],
					errorCount: 1,
					fatalErrorCount: 0,
					warningCount: 0,
					fixableErrorCount: 1,
					fixableWarningCount: 0,
					source: 'console.log( "Hello, world?" );\n',
					suppressedMessages: [],
					usedDeprecatedRules: [
						{
							replacedBy: [],
							ruleId: 'quotes',
						},
						{
							replacedBy: [],
							ruleId: 'semi',
						},
					],
				},
			];
			expect( output ).toEqual( expectOutput );
		} );
	} );
} );
