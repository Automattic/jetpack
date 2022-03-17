const assert = require( 'chai' ).assert;
const childProcess = require( 'child_process' );
const ChildProcess = childProcess.ChildProcess;
const fs = require( 'fs/promises' );
const os = require( 'os' );
const path = require( 'path' );

/**
 * Wait for a process to exit.
 *
 * @param {ChildProcess} proc - The child process.
 * @returns {Promise<number>} A promise that resolves with an object holding the exit code, stdout, and stderr.
 */
function awaitExit( proc ) {
	let stdout = '';
	let stderr = '';

	proc.stdout.on( 'data', data => ( stdout += data ) );
	proc.stderr.on( 'data', data => ( stderr += data ) );
	return new Promise( resolve =>
		proc.once( 'exit', exitCode => resolve( { exitCode, stdout, stderr } ) )
	);
}

describe( 'bin/eslint-changed.js', () => {
	const processes = new Set();
	let tmpdir = null;

	/**
	 * Run eslint-changed.
	 *
	 * @param {string[]} [args] - Arguments to pass.
	 * @param {object} [options] - Options for child_process.
	 * @returns {ChildProcess} The child process.
	 */
	function runEslintChanged( args, options ) {
		const proc = childProcess.fork( path.join( __dirname, '../../bin/eslint-changed.js' ), args, {
			silent: true,
			...options,
		} );
		processes.add( proc );
		return proc;
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
		tmpdir = await fs.mkdtemp( path.join( os.tmpdir(), 'eslint-changed-test-' ) );
	}

	// Clean up after each test.
	afterEach( async () => {
		// Clean up the temporary directory, if any.
		if ( tmpdir ) {
			await fs.rm( tmpdir, { force: true, recursive: true } );
			tmpdir = null;
		}

		// Clean up any leftover processes.
		processes.forEach( proc => proc.kill() );
		processes.clear();
	} );

	it( 'Accepts --version', async () => {
		const proc = await runEslintChanged( [ '--version' ] );
		const data = await awaitExit( proc );
		assert.strictEqual( data.exitCode, 0, 'Exit code is 0' );
		assert.match(
			data.stdout,
			/^\d+\.\d+\.\d+(?:-alpha)?\n$/s,
			'Output looks like a version number'
		);
	} );

	it( 'Fails when not passed --diff or --git', async () => {
		const proc = await runEslintChanged( [] );
		const data = await awaitExit( proc );
		assert.strictEqual( data.exitCode, 1, 'Exit code is 1' );
	} );

	it( 'Fails when passed both --diff and --git', async () => {
		const proc = await runEslintChanged( [ '--git', '--diff', 'foo' ] );
		const data = await awaitExit( proc );
		assert.strictEqual( data.exitCode, 1, 'Exit code is 1' );
	} );

	describe( 'Manual mode', () => {
		it( 'Works in manual mode', async () => {
			const proc = await runEslintChanged( [
				'--format=json',
				'--diff',
				path.join( __dirname, '../fixtures/manual-mode.diff' ),
				'--diff-base',
				'/tmp/x/t',
				'--eslint-orig',
				path.join( __dirname, '../fixtures/manual-mode.orig.json' ),
				'--eslint-new',
				path.join( __dirname, '../fixtures/manual-mode.new.json' ),
			] );
			const data = await awaitExit( proc );
			assert.strictEqual( data.exitCode, 1, 'Exit code is 1' );

			const output = JSON.parse( data.stdout );
			assert.isArray( output, 'Output is a JSON array' );
			const expect = JSON.parse(
				await fs.readFile( path.join( __dirname, '../fixtures/manual-mode.expect.json' ) )
			);
			assert.deepEqual( output, expect );
		} );

		it( 'Exit 0 when no new errors', async () => {
			const proc = await runEslintChanged( [
				'--format=json',
				'--diff',
				path.join( __dirname, '../fixtures/no-new-errors.diff' ),
				'--diff-base',
				'/tmp/x/t',
				'--eslint-orig',
				path.join( __dirname, '../fixtures/no-new-errors.orig.json' ),
				'--eslint-new',
				path.join( __dirname, '../fixtures/no-new-errors.new.json' ),
			] );
			const data = await awaitExit( proc );
			assert.strictEqual( data.exitCode, 0, 'Exit code is 0' );

			const output = JSON.parse( data.stdout );
			assert.isArray( output, 'Output is a JSON array' );
			const expect = JSON.parse(
				await fs.readFile( path.join( __dirname, '../fixtures/no-new-errors.expect.json' ) )
			);
			assert.deepEqual( output, expect );
		} );

		it( 'Filters by filename', async () => {
			const proc = await runEslintChanged( [
				'--format=json',
				'--diff',
				path.join( __dirname, '../fixtures/files-123.diff' ),
				'--diff-base',
				'/tmp/x/t',
				'--eslint-orig',
				path.join( __dirname, '../fixtures/files-123.orig.json' ),
				'--eslint-new',
				path.join( __dirname, '../fixtures/files-123.new.json' ),
				'1.js',
				'3.js',
			] );
			const data = await awaitExit( proc );
			assert.strictEqual( data.exitCode, 1, 'Exit code is 1' );

			const output = JSON.parse( data.stdout );
			assert.isArray( output, 'Output is a JSON array' );
			const expect = JSON.parse(
				await fs.readFile( path.join( __dirname, '../fixtures/files-123.expect.json' ) )
			);
			assert.deepEqual( output, expect );
		} );

		it( 'Includes new errors in unchanged lines', async () => {
			const proc = await runEslintChanged( [
				'--format=json',
				'--diff',
				path.join( __dirname, '../fixtures/new-err-not-in-diff.diff' ),
				'--diff-base',
				'/tmp/x/t',
				'--eslint-orig',
				path.join( __dirname, '../fixtures/new-err-not-in-diff.orig.json' ),
				'--eslint-new',
				path.join( __dirname, '../fixtures/new-err-not-in-diff.new.json' ),
			] );
			const data = await awaitExit( proc );
			assert.strictEqual( data.exitCode, 1, 'Exit code is 1' );

			const output = JSON.parse( data.stdout );
			assert.isArray( output, 'Output is a JSON array' );
			const expect = JSON.parse(
				await fs.readFile( path.join( __dirname, '../fixtures/new-err-not-in-diff.expect.json' ) )
			);
			assert.deepEqual( output, expect );
		} );

		it( 'Does not include new errors in unchanged lines with --in-diff-only', async () => {
			const proc = await runEslintChanged( [
				'--format=json',
				'--in-diff-only',
				'--diff',
				path.join( __dirname, '../fixtures/new-err-not-in-diff.diff' ),
				'--diff-base',
				'/tmp/x/t',
				'--eslint-orig',
				path.join( __dirname, '../fixtures/new-err-not-in-diff.orig.json' ),
				'--eslint-new',
				path.join( __dirname, '../fixtures/new-err-not-in-diff.new.json' ),
			] );
			const data = await awaitExit( proc );
			assert.strictEqual( data.exitCode, 0, 'Exit code is 0' );

			const output = JSON.parse( data.stdout );
			assert.isArray( output, 'Output is a JSON array' );
			const expect = JSON.parse(
				await fs.readFile( path.join( __dirname, '../fixtures/new-err-not-in-diff.expect2.json' ) )
			);
			assert.deepEqual( output, expect );
		} );

		it( 'Gets diff-base from cwd', async () => {
			await mktmpdir();

			for ( const suffix of [ 'diff', 'orig.json', 'new.json', 'expect.json' ] ) {
				const data = await fs.readFile(
					path.join( __dirname, `../fixtures/manual-mode.${ suffix }` ),
					'utf-8'
				);
				await fs.writeFile(
					path.join( tmpdir, `test.${ suffix }` ),
					data.replace( /\/tmp\/x\/t\//g, tmpdir + '/' )
				);
			}

			const proc = await runEslintChanged(
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
			const data = await awaitExit( proc );
			assert.strictEqual( data.exitCode, 1, 'Exit code is 1' );

			const output = JSON.parse( data.stdout );
			assert.isArray( output, 'Output is a JSON array' );
			const expect = JSON.parse( await fs.readFile( path.join( tmpdir, 'test.expect.json' ) ) );
			assert.deepEqual( output, expect );
		} );

		const argsets = [
			[ '--diff', path.join( __dirname, '../fixtures/no-new-errors.diff' ) ],
			[ '--eslint-orig', path.join( __dirname, '../fixtures/no-new-errors.orig.json' ) ],
			[ '--eslint-new', path.join( __dirname, '../fixtures/no-new-errors.new.json' ) ],
		];
		for ( let i = ( 1 << argsets.length ) - 2; i > 0; i-- ) {
			const args = [];
			const missing = [];
			for ( let j = 0; j < argsets.length; j++ ) {
				if ( i & ( 1 << j ) ) {
					args.push( ...argsets[ j ] );
				} else {
					missing.push( argsets[ j ][ 0 ] );
				}
			}

			it( `Fails with incomplete arguments: missing ${ missing.join( ' ' ) }`, async () => {
				const proc = await runEslintChanged( [ '--format=json', ...args ] );
				const data = await awaitExit( proc );
				assert.strictEqual( data.exitCode, 1, 'Exit code is 1' );
			} );
		}
	} );

	describe( 'Git mode', function () {
		this.timeout( 5000 );

		/**
		 * Set up a temporary directory with a git repo.
		 *
		 * The path is stored in `tmpdir`.
		 *
		 * @param {object[]} branches - An array of branches to create.
		 * @param {string} [branches.name] - Name of the branch.
		 * @param {string} [branches.parent] - Name of the parent branch. If omitted, the parent is the previous entry in the array. Must be omitted in the first entry.
		 * @param {object<string, string | null>} branches.files - Files to modify, and their contents (or null to delete the file).
		 * @param {object<string, string | null>} [staged] - Files to modify and stage.
		 * @param {object<string, string | null>} [unstaged] - Files to modify and leave unstaged.
		 */
		async function mktmpdirgit( branches, staged, unstaged ) {
			await mktmpdir();

			const opts = {
				cwd: tmpdir,
				env: {
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
			 * @param {object<string, string | null>} files - Files to modify, and their contents (or null to delete the file).
			 * @param {boolean} git - Whether to do git manipulations.
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

		const eslintrc = JSON.stringify(
			{
				extends: 'eslint:recommended',
				env: {
					node: true,
				},
				rules: {
					indent: [ 2, 'tab' ],
					quotes: [ 2, 'single' ],
					'linebreak-style': [ 2, 'unix' ],
					semi: [ 2, 'always' ],
				},
			},
			null,
			4
		);

		const standardRepo = [
			[
				{
					name: 'base',
					files: {
						'.eslintrc': eslintrc,
						'1.js': "console.log( 'Hello, world!' );\n",
						'2.js': "console.log( 'Hello, world!' );\n",
						'3.js': "console.log( 'Hello, world!' );\n",
					},
				},
				{
					name: 'master',
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

		it( 'Fails gracefully without git', async () => {
			const proc = await runEslintChanged( [ '--format=json', '--git' ], {
				cwd: tmpdir,
				env: { GIT: 'this-command-really-should-not-exist' },
			} );
			const data = await awaitExit( proc );
			assert.strictEqual( data.exitCode, 1, 'Exit code is 1' );
			assert.strictEqual(
				data.stderr,
				'error: failed to execute git as `this-command-really-should-not-exist`. Use environment variable `GIT` to override.\n'
			);
		} );

		it( 'Works in git mode, --git-staged is the default', async () => {
			await mktmpdirgit( ...standardRepo );

			const proc = await runEslintChanged( [ '--format=json', '--git' ], { cwd: tmpdir } );
			const data = await awaitExit( proc );
			assert.strictEqual( data.exitCode, 1, 'Exit code is 1' );

			const output = JSON.parse( data.stdout );
			assert.isArray( output, 'Output is a JSON array' );
			const expect = [
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
					usedDeprecatedRules: [],
				},
			];
			assert.deepEqual( output, expect );
		} );

		it( 'Works in git mode, explicit --git-staged', async () => {
			await mktmpdirgit( ...standardRepo );

			const proc = await runEslintChanged( [ '--format=json', '--git', '--git-staged' ], {
				cwd: tmpdir,
			} );
			const data = await awaitExit( proc );
			assert.strictEqual( data.exitCode, 1, 'Exit code is 1' );

			const output = JSON.parse( data.stdout );
			assert.isArray( output, 'Output is a JSON array' );
			const expect = [
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
					usedDeprecatedRules: [],
				},
			];
			assert.deepEqual( output, expect );
		} );

		it( 'Works with --git-unstaged', async () => {
			await mktmpdirgit( ...standardRepo );

			const proc = await runEslintChanged( [ '--format=json', '--git', '--git-unstaged' ], {
				cwd: tmpdir,
			} );
			const data = await awaitExit( proc );
			assert.strictEqual( data.exitCode, 1, 'Exit code is 1' );

			const output = JSON.parse( data.stdout );
			assert.isArray( output, 'Output is a JSON array' );
			const expect = [
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
					usedDeprecatedRules: [],
				},
			];
			assert.deepEqual( output, expect );
		} );

		it( 'Works with --git-base', async () => {
			await mktmpdirgit( ...standardRepo );

			const proc = await runEslintChanged( [ '--format=json', '--git', '--git-base', 'base' ], {
				cwd: tmpdir,
			} );
			const data = await awaitExit( proc );
			assert.strictEqual( data.exitCode, 1, 'Exit code is 1' );

			const output = JSON.parse( data.stdout );
			assert.isArray( output, 'Output is a JSON array' );
			const expect = [
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
						},
					],
					errorCount: 1,
					fatalErrorCount: 0,
					warningCount: 0,
					fixableErrorCount: 0,
					fixableWarningCount: 0,
					source: "var x;\nconsole.log( 'Hello, world!' );\n",
					suppressedMessages: [],
					usedDeprecatedRules: [],
				},
			];
			assert.deepEqual( output, expect );
		} );

		it( 'Works with added and deleted files', async () => {
			await mktmpdirgit(
				[
					{
						files: {
							'.eslintrc': eslintrc,
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

			const proc = await runEslintChanged( [ '--format=json', '--git' ], { cwd: tmpdir } );
			const data = await awaitExit( proc );
			assert.strictEqual( data.exitCode, 1, 'Exit code is 1' );

			const output = JSON.parse( data.stdout );
			assert.isArray( output, 'Output is a JSON array' );
			const expect = [
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
						},
					],
					errorCount: 1,
					fatalErrorCount: 0,
					warningCount: 0,
					fixableErrorCount: 0,
					fixableWarningCount: 0,
					source: 'var x = 1;\n',
					suppressedMessages: [],
					usedDeprecatedRules: [],
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
					usedDeprecatedRules: [],
				},
			];
			assert.deepEqual( output, expect );
		} );

		it( 'Works with explicitly specified files', async () => {
			await mktmpdirgit(
				[
					{
						files: {
							'.eslintrc': eslintrc,
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

			const proc = await runEslintChanged( [ '--format=json', '--git', '1.js', '2.js' ], {
				cwd: tmpdir,
			} );
			const data = await awaitExit( proc );
			assert.strictEqual( data.exitCode, 1, 'Exit code is 1' );

			const output = JSON.parse( data.stdout );
			assert.isArray( output, 'Output is a JSON array' );
			const expect = [
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
					usedDeprecatedRules: [],
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
					usedDeprecatedRules: [],
				},
			];
			assert.deepEqual( output, expect );
		} );

		it( 'Works with --in-diff-only', async () => {
			await mktmpdirgit(
				[
					{
						files: {
							'.eslintrc': eslintrc,
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

			const proc = await runEslintChanged(
				[ '--format=json', '--git', '--in-diff-only', '1.js', '2.js' ],
				{
					cwd: tmpdir,
				}
			);
			const data = await awaitExit( proc );
			assert.strictEqual( data.exitCode, 1, 'Exit code is 1' );

			const output = JSON.parse( data.stdout );
			assert.isArray( output, 'Output is a JSON array' );
			const expect = [
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
						},
					],
					errorCount: 1,
					fatalErrorCount: 0,
					warningCount: 0,
					fixableErrorCount: 0,
					fixableWarningCount: 0,
					source: "var y = 'Hello, world!';\n\n\n\n\n\n\n\n\n\n\n\nconsole.log( x )\n",
					suppressedMessages: [],
					usedDeprecatedRules: [],
				},
			];
			assert.deepEqual( output, expect );
		} );
	} );
} );
