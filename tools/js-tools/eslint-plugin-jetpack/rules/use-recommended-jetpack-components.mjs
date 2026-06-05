import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

const PACKAGE_NAME = '@automattic/jetpack-components';
const DEFAULT_DENYLIST_PATH = path.resolve(
	__dirname,
	'..',
	'..',
	'..',
	'eslint',
	'jetpack-components-denylist.json'
);

/**
 * Interpolate `{{ name }}` and `{{ source }}` placeholders in a lint message.
 *
 * @param {string|undefined} template - Message template.
 * @param {string}           name     - Component name.
 * @param {string}           source   - Import source.
 * @return {string} Resolved message string.
 */
function resolveMessage( template, name, source ) {
	if ( ! template ) {
		return `\`${ name }\` from \`${ source }\` is not recommended. Prefer \`@wordpress/components\` or \`@wordpress/ui\` when an equivalent exists.`;
	}

	return template.replace( /\{\{\s*name\s*\}\}/g, name ).replace( /\{\{\s*source\s*\}\}/g, source );
}

/**
 * Load the Jetpack components denylist from disk.
 *
 * @param {string} denylistPath - Path to the denylist JSON file.
 * @return {{ components: Record<string, string>, subpaths: Record<string, string> }} Denylist data.
 */
function loadDenylist( denylistPath ) {
	const raw = JSON.parse( fs.readFileSync( denylistPath, 'utf8' ) );

	return {
		components: normalizeEntries( raw.components ),
		subpaths: normalizeEntries( raw.subpaths ),
	};
}

/**
 * Normalize denylist entries to a flat component-name → message map.
 *
 * @param {Record<string, string | { message: string }>|undefined} entries - Denylist entries.
 * @return {Record<string, string>} Normalized message map.
 */
function normalizeEntries( entries ) {
	if ( ! entries ) {
		return {};
	}

	return Object.fromEntries(
		Object.entries( entries ).map( ( [ key, value ] ) => {
			if ( typeof value === 'string' ) {
				return [ key, value ];
			}

			return [ key, value.message ];
		} )
	);
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Encourage the use of WordPress components instead of discouraged Jetpack components.',
		},
		schema: [
			{
				type: 'object',
				properties: {
					denylistPath: {
						type: 'string',
					},
				},
				additionalProperties: false,
			},
		],
	},
	create( context ) {
		const options = context.options[ 0 ] ?? {};
		const configuredPath = options.denylistPath ?? DEFAULT_DENYLIST_PATH;
		const denylistPath = path.isAbsolute( configuredPath )
			? configuredPath
			: path.resolve( context.cwd ?? process.cwd(), configuredPath );
		const { components, subpaths } = loadDenylist( denylistPath );

		return {
			/**
			 * Lint import declarations from Jetpack components.
			 *
			 * @param {import('estree').ImportDeclaration} node - Import declaration AST node.
			 */
			ImportDeclaration( node ) {
				if ( typeof node.source.value !== 'string' ) {
					return;
				}

				const source = node.source.value;

				if ( source === PACKAGE_NAME ) {
					reportMainPackageImports( context, node, source, components );
					return;
				}

				if ( source.startsWith( `${ PACKAGE_NAME }/` ) ) {
					reportSubpathImports(
						context,
						node,
						source,
						source.slice( PACKAGE_NAME.length + 1 ),
						components,
						subpaths
					);
				}
			},
		};
	},
};

/**
 * Report discouraged imports from `@automattic/jetpack-components`.
 *
 * @param {import('eslint').Rule.RuleContext}  context    - ESLint context.
 * @param {import('estree').ImportDeclaration} node       - Import declaration node.
 * @param {string}                             source     - Import source.
 * @param {Record<string, string>}             components - Component denylist.
 */
function reportMainPackageImports( context, node, source, components ) {
	node.specifiers.forEach( specifier => {
		if ( specifier.type !== 'ImportSpecifier' ) {
			return;
		}

		const name = specifier.imported.name;
		const message = components[ name ];

		if ( message ) {
			context.report( {
				node: specifier,
				message: resolveMessage( message, name, source ),
			} );
		}
	} );
}

/**
 * Report discouraged imports from `@automattic/jetpack-components/*` subpaths.
 *
 * @param {import('eslint').Rule.RuleContext}  context    - ESLint context.
 * @param {import('estree').ImportDeclaration} node       - Import declaration node.
 * @param {string}                             source     - Import source.
 * @param {string}                             subpath    - Subpath without leading slash.
 * @param {Record<string, string>}             components - Component denylist.
 * @param {Record<string, string>}             subpaths   - Subpath denylist.
 */
function reportSubpathImports( context, node, source, subpath, components, subpaths ) {
	const subpathMessage = subpaths[ subpath ];

	node.specifiers.forEach( specifier => {
		if ( specifier.type === 'ImportDefaultSpecifier' && subpathMessage ) {
			context.report( {
				node: specifier,
				message: resolveMessage( subpathMessage, subpath, source ),
			} );
			return;
		}

		if ( specifier.type !== 'ImportSpecifier' ) {
			return;
		}

		const name = specifier.imported.name;
		const message = components[ name ] ?? subpathMessage;

		if ( message ) {
			context.report( {
				node: specifier,
				message: resolveMessage( message, name, source ),
			} );
		}
	} );
}

export default rule;
