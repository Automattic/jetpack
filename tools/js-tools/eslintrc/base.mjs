// Base eslint config generator for normal projects. If for some reason you need to override the config, use this something like
//
// ```
// import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';
//
// export default defineConfig(
//     makeBaseConfig( import.meta.url ),
//
//     // Add any overrides after.
// );
// ```

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixupPluginRules } from '@eslint/compat';
import eslintJs from '@eslint/js';
import eslintJson from '@eslint/json';
import tanstackEslintPluginQuery from '@tanstack/eslint-plugin-query';
import wordpressEslintPlugin from '@wordpress/eslint-plugin';
import makeDebug from 'debug';
import { defineConfig, globalIgnores } from 'eslint/config';
import { defaultConditionNames } from 'eslint-import-resolver-typescript';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginLodash from 'eslint-plugin-lodash';
import eslintPluginN from 'eslint-plugin-n';
import eslintPluginPackageJson from 'eslint-plugin-package-json/experimental';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginStorybook from 'eslint-plugin-storybook';
import eslintPluginYouDontNeedLodashUnderscore from 'eslint-plugin-you-dont-need-lodash-underscore';
import { glob } from 'glob';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';
import loadIgnorePatterns from '../load-eslint-ignore.js';
import { javascriptFiles, jsonFiles, typescriptFiles, jestFiles } from './files.mjs';
import jestConfig from './jest.mjs';
import makeReactConfig from './react.mjs';

export * from './files.mjs';
export { defineConfig, globalIgnores } from 'eslint/config';

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
 * Generate the base eslint config.
 *
 * @param {string}   configurl       - File URL for the eslint.config.mjs. Pass `import.meta.url`.
 * @param {object}   opts            - Options
 * @param {string[]} opts.envs       - Sets of globals to use. Default `[ 'browser' ]`.
 * @param {boolean}  opts.react      - Enable React rules. Default is read from `project/.../.../package.json` if possible.
 * @param {string}   opts.textdomain - Text domain for `@wordpress/i18n-text-domain` rule. Default is read from `project/.../.../composer.json` if possible.
 * @return {object[]} Eslint config.
 */
export function makeBaseConfig( configurl, opts = {} ) {
	const basedir = path.dirname( fileURLToPath( configurl ) );

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

	const envConditionNames = [ 'jetpack:src' ];

	const jsPackageJsons = glob
		.sync( path.join( rootdir, 'projects/js-packages/*/package.json' ) )
		.map( p => path.relative( basedir, p ) )
		.filter( p => ! p.startsWith( '../' ) );
	const nonPrivateJsPackageJsons = jsPackageJsons.filter( p => {
		try {
			return ! JSON.parse( fs.readFileSync( path.join( basedir, p ) ) )?.private;
		} catch {
			return false;
		}
	} );

	const storybookMainJs = path.relative(
		basedir,
		path.join( rootdir, 'projects/js-packages/storybook/storybook/main.js' )
	);

	return defineConfig(
		globalIgnores( loadIgnorePatterns( basedir ) ),

		// Extended configs.
		{
			files: javascriptFiles,
			extends: [
				eslintJs.configs.recommended,

				eslintPluginStorybook.configs[ 'flat/recommended' ].map( v => {
					// We don't have a `.storybook/` dir at the repo root like the config expects.
					if ( Array.isArray( v.files ) ) {
						v.files = v.files.map( s =>
							s.startsWith( '.storybook/main.' ) ? storybookMainJs : s
						);
					}
					return v;
				} ),
				{
					name: 'Storybook overrides',
					files: [ '**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)' ],
					rules: {
						'storybook/csf-component': 'warn',

						// Our Storybook uses vite while our builds use webpack. Easier to stick with the generic package.
						'storybook/no-renderer-packages': 'off',
					},
				},
				{
					name: 'Storybook config overrides',
					files: [ storybookMainJs ],
					rules: {
						'storybook/no-uninstalled-addons': [
							'error',
							{
								packageJsonLocation: path.join(
									rootdir,
									'projects/js-packages/storybook/package.json'
								),
							},
						],
					},
				},

				// Can't just `wordpressEslintPlugin.configs["recommended-with-formatting"]` because that includes React too and we only want that with opts.react.
				wordpressEslintPlugin.configs[ 'jsx-a11y' ],
				wordpressEslintPlugin.configs.custom,
				wordpressEslintPlugin.configs.esnext,
				wordpressEslintPlugin.configs.i18n,

				{
					plugins: {
						'you-dont-need-lodash-underscore': fixupPluginRules(
							eslintPluginYouDontNeedLodashUnderscore
						),
					},
					rules: {
						...eslintPluginYouDontNeedLodashUnderscore.configs.compatible.rules,

						// Replacement for throttle is not as straightforward as you-dont-need-lodash-underscore claims.
						'you-dont-need-lodash-underscore/throttle': 'off',
					},
				},
				tanstackEslintPluginQuery.configs[ 'flat/recommended' ],
			],
		},

		// Prettier
		{
			files: [ ...javascriptFiles, ...jsonFiles ],
			plugins: {
				prettier: eslintPluginPrettier,
			},
			extends: [ eslintPluginPrettierRecommended ],
		},

		// Base config.
		{
			name: 'Monorepo base config',
			files: javascriptFiles,
			plugins: {
				import: fixupPluginRules( eslintPluginImport ), // https://github.com/import-js/eslint-plugin-import/issues/3227
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
					tsconfigRootDir: rootdir,
					ecmaFeatures: {
						jsx: true,
					},
				},
			},
			settings: {
				'import/extensions': javascriptFiles
					.map( v => v.replace( '**/*', '' ) )
					.filter( v => v !== '.svelte' ),
				'import/internal-regex': '^jetpack-js-tools/',
				'import/resolver': {
					typescript: {
						project: tsconfigPath,
						conditionNames: [ ...envConditionNames, ...defaultConditionNames ],
						alias: {
							// These somehow confuse import/named (maybe they're outdated or incomplete?), alias them to nothing.
							'@types/lodash': [ null ],
							'@types/wordpress__block-editor': [ null ],
						},
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

				'import/no-extraneous-dependencies': [
					'error',
					{
						peerDependencies: true,
					},
				],
				'import/no-unresolved': [
					'error',
					{
						ignore: [
							// Jest dummy package.
							'^@jest/globals$',
						],
					},
				],
				'import/default': 'warn',
				'import/named': 'warn',
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

				// Too many of these to clean up now. Unclear if we even want to.
				'jsdoc/reject-any-type': 'off',
				'jsdoc/reject-function-type': 'off',

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
		opts.react ? makeReactConfig( configurl ) : [],

		// Typescript.
		{
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
				// TS should handle this too.
				'import/named': 'off',
			},
		},

		// JSON files.
		{
			files: [ '**/*.json' ],
			plugins: { json: eslintJson },
			language: 'json/json',
			extends: [ 'json/recommended' ],
		},

		// JSONC files, which includes vscode and tsconfig.
		{
			files: [
				'**/*.jsonc',
				'.vscode/*.json',
				'**/tsconfig.json',
				'**/tsconfig.*.json',
				'**/jsconfig.json',
			],
			plugins: { json: eslintJson },
			language: 'json/jsonc',
			extends: [ 'json/recommended' ],
		},

		// lint JSON5 files
		{
			files: [ '**/*.json5' ],
			plugins: { json: eslintJson },
			language: 'json/json5',
			extends: [ 'json/recommended' ],
		},

		// package.json files.
		{
			name: 'Package.json - base',
			files: [ '**/package.json' ],
			plugins: {
				'package-json': eslintPluginPackageJson,
			},
			rules: {
				...eslintPluginPackageJson.configs.recommended.rules,

				// Our mirror repo publishing setup makes `files` pointless.
				'package-json/require-files': 'off',

				// Empty browserslist does something.
				'package-json/no-empty-fields': [ 'error', { ignoreProperties: [ 'browserslist' ] } ],

				// Maybe someday, but not yet.
				'package-json/require-sideEffects': 'off',
				'package-json/require-type': 'off',
			},
		},
		{
			name: 'Package.json - Only js-packages need a name',
			files: [ '**/package.json' ],
			ignores: jsPackageJsons,
			rules: {
				'package-json/require-name': 'off',
			},
		},
		{
			name: 'Package.json - Only published js-packages need various fields',
			files: [ '**/package.json' ],
			ignores: nonPrivateJsPackageJsons,
			rules: {
				'package-json/require-description': 'off',
				'package-json/require-version': 'off',
				'package-json/require-license': 'off',
			},
		},

		// Jest.
		{
			files: jestFiles,
			extends: [ jestConfig ],
		}
	);
}

/**
 * Make a config adding globals for an environment.
 *
 * @param {string|string[]} envs  - Environments.
 * @param {string[]}        files - File patterns.
 * @return {object} Eslint config.
 */
export function makeEnvConfig( envs, files ) {
	return defineConfig( {
		files: files,
		languageOptions: {
			globals: ( Array.isArray( envs ) ? envs : [ envs ] ).reduce(
				( a, v ) => ( { ...a, ...globals[ v ] } ),
				{}
			),
		},
	} );
}
