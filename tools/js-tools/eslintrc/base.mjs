// Base eslint config generator for normal projects. If for some reason you need to override the config, use this something like
//
// ```
// import makeBaseConfig from 'jetpack-js-tools/eslintrc/base.mjs';
//
// export default [
//     ...makeBaseConfig( import.meta.url ),
//
//     // Add any overrides after.
// ];
// ```

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixupConfigRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import eslintJs from '@eslint/js';
import tanstackEslintPluginQuery from '@tanstack/eslint-plugin-query';
import makeDebug from 'debug';
import { defaultConditionNames } from 'eslint-import-resolver-typescript';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginLodash from 'eslint-plugin-lodash';
import eslintPluginN from 'eslint-plugin-n';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';
import loadIgnorePatterns from '../load-eslint-ignore.js';
import jestConfig from './jest.mjs';
import makeReactConfig from './react.mjs';

const debug = makeDebug( 'eslintrc/base' );

const rootdir = fileURLToPath( new URL( '../../..', import.meta.url ) );

const restrictedPaths = [
	'lib/sites-list',
	'lib/mixins/data-observe',
	{
		name: 'classnames',
		message:
			"Please use `clsx` instead. It's a lighter and faster drop-in replacement for `classnames`.",
	},
];

/**
 * File patterns for files treated as TypeScript.
 */
export const typescriptFiles = [ '**/*.ts', '**/*.tsx' ];

/**
 * File patterns for files treated as Jest.
 */
export const jestFiles = [
	'**/jest-globals.?([mc])js',
	'**/jest.setup.?([mc])js',
	// Note: Keep the patterns here in sync with tools/js-tools/jest/config.base.js.
	'**/__tests__/**/*.[jt]s?(x)',
	'**/?(*.)+(spec|test).[jt]s?(x)',
	'**/test/*.[jt]s?(x)',
	// Other files under /test/ probably need jest rules too.
	'**/test?(s)/**/*.[jt]s?(x)',
];

/**
 * Generate the base eslint config.
 *
 * @param {string}   configurl       - File URL for the eslint.config.mjs. Pass `import.meta.url`.
 * @param {object}   opts            - Options
 * @param {string[]} opts.envs       - Sets of globals to use. Default `[ 'browser' ]`.
 * @param {boolean}  opts.react      - Enable React rules. Default is read from `project/.../.../package.json` if possible.
 * @param {string}   opts.textdomain - Text domain for `@wordpress/i18n-text-domain` rule. Default is read from `project/.../.../composer.json` if possible.
 * @return {object[]} Eslint config.
 */
export default function makeBaseConfig( configurl, opts = {} ) {
	const basedir = path.dirname( fileURLToPath( configurl ) );

	const compat = new FlatCompat( {
		baseDirectory: basedir,
		resolvePluginsRelativeTo: fileURLToPath( import.meta.url ),
	} );

	let m;
	if (
		basedir.startsWith( rootdir ) &&
		( m = basedir
			.substring( rootdir.length )
			.match( /^projects\/(?<slug>(?<type>[^/]+)\/[^/]+)(?:\/|$)/ ) )
	) {
		if ( opts.textdomain == null ) {
			try {
				const composerJson = JSON.parse(
					fs.readFileSync( path.join( rootdir, 'projects', m.groups.slug, 'composer.json' ) )
				);
				if ( m.groups.type === 'plugins' ) {
					opts.textdomain =
						composerJson.extra?.[ 'wp-plugin-slug' ] ?? composerJson.extra?.[ 'beta-plugin-slug' ];
				} else {
					opts.textdomain = composerJson.extra?.textdomain;
				}
				debug( `Auto-detected textdomain for ${ configurl } is ${ opts.textdomain }` );
			} catch ( e ) {
				debug( `No auto-detected textdomain for ${ configurl }: ${ e.message }` );
			}
		}
		if ( opts.react == null ) {
			try {
				const packageJson = JSON.parse(
					fs.readFileSync( path.join( rootdir, 'projects', m.groups.slug, 'package.json' ) )
				);
				opts.react = !! (
					packageJson.dependencies?.react ??
					packageJson.devDependencies?.react ??
					packageJson.optionalDependencies?.react ??
					packageJson.peerDependencies?.react
				);
				debug( `Auto-detected react for ${ configurl } is ${ opts.react }` );
			} catch ( e ) {
				debug( `No auto-detected react for ${ configurl }: ${ e.message }` );
			}
		}
	}

	let tsconfigPath = false;
	for ( let d = basedir; d.startsWith( rootdir ); d = path.dirname( d ) ) {
		if ( fs.existsSync( path.join( d, 'tsconfig.json' ) ) ) {
			tsconfigPath = path.join( d, 'tsconfig.json' );
			break;
		}
		if ( fs.existsSync( path.join( d, 'jsconfig.json' ) ) ) {
			tsconfigPath = path.join( d, 'jsconfig.json' );
			break;
		}
	}

	return [
		{
			name: 'Global files',
			files: [
				'**/*.js',
				'**/*.jsx',
				'**/*.cjs',
				'**/*.mjs',
				'**/*.ts',
				'**/*.tsx',
				'**/*.svelte',
			],
		},
		{
			name: 'Global ignores',
			ignores: loadIgnorePatterns( basedir ),
		},

		// Extended configs.
		eslintJs.configs.recommended,
		// Can't just `@wordpress/recommended-with-formatting` because that includes React too and we only want that with opts.react.
		...fixupConfigRules(
			compat.extends(
				'plugin:@wordpress/jsx-a11y',
				'plugin:@wordpress/custom',
				'plugin:@wordpress/esnext',
				'plugin:@wordpress/i18n'
			)
		),
		eslintPluginPrettierRecommended,
		...tanstackEslintPluginQuery.configs[ 'flat/recommended' ],

		// Base config.
		{
			name: 'Monorepo base config',
			plugins: {
				import: eslintPluginImport,
				prettier: eslintPluginPrettier,
				lodash: eslintPluginLodash,
				n: eslintPluginN,
				'@typescript-eslint': typescriptEslint.plugin,
			},

			languageOptions: {
				parser: typescriptEslint.parser,
				globals: ( opts.envs ?? [ 'browser' ] ).reduce(
					( a, v ) => ( { ...a, ...globals[ v ] } ),
					{}
				),
				ecmaVersion: 'latest', // Restore default overridden by plugin:@wordpress/esnext
				parserOptions: {
					ecmaFeatures: {
						jsx: true,
					},
				},
			},
			settings: {
				'import/resolver': {
					typescript: {
						project: tsconfigPath,
						conditionNames: process.env.npm_config_jetpack_webpack_config_resolve_conditions
							? process.env.npm_config_jetpack_webpack_config_resolve_conditions
									.split( ',' )
									.concat( defaultConditionNames )
							: defaultConditionNames,
					},
				},
				jsdoc: {
					preferredTypes: {
						// Override @wordpress/eslint-plugin, we'd rather follow jsdoc and typescript in this.
						object: 'object',
						Object: 'object',
						'object.<>': 'Object<>',
						'Object.<>': 'Object<>',
						'object<>': 'Object<>',
					},
				},
			},
			rules: {
				// Set domain from opts, with a bogus default in case it's omitted.
				'@wordpress/i18n-text-domain': [
					'error',
					{
						allowedTextDomain:
							opts.textdomain ??
							"no text domain is set in this in this project's eslint.config.mjs or composer.json",
					},
				],

				// REST API objects include underscores
				camelcase: 'off',

				eqeqeq: [
					'error',
					'always',
					{
						// `== null` is a convenient shorthand for exactly `=== null || === undefined`.
						null: 'ignore',
					},
				],

				'import/order': [
					'error',
					{
						alphabetize: { order: 'asc' },
						groups: [ 'builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type' ],
						'newlines-between': 'never',
					},
				],

				// import/no-duplicates knows about TypeScript, use that instead.
				'no-duplicate-imports': 'off',
				'import/no-duplicates': 'error',

				'jsdoc/check-indentation': [
					'warn',
					{
						excludeTags: [
							'example',
							// Tags aligned by jsdoc/check-line-alignment from @wordpress/eslint-plugin.
							'param',
							'arg',
							'argument',
							'property',
							'prop',
						],
					},
				],
				'jsdoc/check-syntax': 'warn',
				'jsdoc/check-tag-names': [ 'error', { definedTags: [ 'jest-environment' ] } ],
				'jsdoc/check-values': 'warn',
				'jsdoc/no-multi-asterisks': [ 'error', { preventAtMiddleLines: true } ],
				'jsdoc/require-description': 'warn',
				'jsdoc/require-hyphen-before-param-description': 'warn',
				'jsdoc/require-jsdoc': 'warn',
				'jsdoc/require-param-description': 'warn',
				'jsdoc/require-returns': 'warn',
				'jsdoc/require-yields': 'warn',

				'jsx-a11y/anchor-has-content': 'off',
				'jsx-a11y/anchor-is-valid': 'off',
				// Redundant roles are sometimes necessary for screen reader support. For instance, VoiceOver
				// on Safari requires `role=list` to announce the list if the style is overwritten.
				'jsx-a11y/no-redundant-roles': 'off',

				'lodash/import-scope': [ 'error', 'member' ],

				'n/no-deprecated-api': 'error',
				'n/no-exports-assign': 'error',
				'n/no-process-exit': 'error',
				'n/process-exit-as-throw': 'error',
				'n/no-restricted-import': [ 'error', restrictedPaths ],
				'n/no-restricted-require': [ 'error', restrictedPaths ],

				'new-cap': [ 'error', { capIsNew: false, newIsCap: true } ],
				'no-new': 'error',
				'object-shorthand': 'off',
				'prefer-const': [ 'error', { destructuring: 'any' } ],
				strict: [ 'error', 'never' ],

				// @typescript-eslint/no-unused-expressions works better. Use it always.
				'no-unused-expressions': 'off',
				'@typescript-eslint/no-unused-expressions': [
					'error',
					{
						// `cond && func()` and `cond ? func1() : func2()` are too useful to forbid.
						allowShortCircuit: true,
						allowTernary: true,
					},
				],
			},
		},

		// Allow commonjs globals in .js and .cjs files.
		// (unfortunately we can't easily determine if any particular nested directory has `"type":"module"` or not)
		{
			files: [ '**/*.js', '**/*.cjs' ],
			languageOptions: {
				globals: globals.commonjs,
			},
			rules: {
				'@typescript-eslint/no-require-imports': 'off',
			},
		},

		// Various config files should allow 'node' globals.
		{
			files: [ '**/*.config.?([cm])js', '**/webpack.config.*.?([cm])js' ],
			languageOptions: {
				globals: globals.node,
			},
		},

		// React config.
		...( opts.react ? makeReactConfig( configurl ) : [] ),

		// Typescript.
		...typescriptEslint.config( {
			files: typescriptFiles,
			extends: [ typescriptEslint.configs.recommended ],
			rules: {
				'@typescript-eslint/no-empty-object-type': [
					'error',
					{ allowInterfaces: 'with-single-extends' },
				],
				// Mark types in jsdoc as used without reporting about any that are undefined.
				'jsdoc/no-undefined-types': [ 'warn', { disableReporting: true } ],
				// TS should mostly have the type set.
				'jsdoc/require-param-type': 'off',
				'jsdoc/require-property-type': 'off',
				// Let us use TS return type for better inference
				'jsdoc/require-returns-type': 'off',
			},
		} ),
		// Jest.
		...typescriptEslint.config( {
			files: jestFiles,
			extends: [ jestConfig ],
		} ),
	];
}

/**
 * Make a config adding globals for an environment.
 *
 * @param {string|string[]} envs  - Environments.
 * @param {string[]}        files - File patterns.
 * @return {object} Eslint config.
 */
export function makeEnvConfig( envs, files ) {
	return {
		files: files,
		languageOptions: {
			globals: ( Array.isArray( envs ) ? envs : [ envs ] ).reduce(
				( a, v ) => ( { ...a, ...globals[ v ] } ),
				{}
			),
		},
	};
}

export const config = typescriptEslint.config;
