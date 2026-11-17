import { allProjects, allProjectsByType, dirs, projectTypes } from './projectHelpers.js';

/**
 * Hidden name for a builder's completers. The NUL keeps it off the command line.
 */
export const COMPLETION_COMMAND = '\0yargs-completion';

/**
 * Complete a `type/name` project: the types, then that type's projects, or every
 * project whose name contains the word when it matches no type.
 *
 * @param {string} current - The word being completed.
 * @return {string[]} Candidates.
 */
export function completeProject( current ) {
	const slash = current.indexOf( '/' );
	if ( slash >= 0 ) {
		const type = current.slice( 0, slash );
		return projectTypes.includes( type ) ? allProjectsByType( type ) : [];
	}
	const types = projectTypes.filter( type => type.startsWith( current ) );
	if ( types.length > 1 ) {
		return types.map( type => `${ type }/` );
	}
	if ( types.length === 1 ) {
		return allProjectsByType( types[ 0 ] );
	}
	return allProjects().filter( project =>
		project.slice( project.indexOf( '/' ) + 1 ).includes( current )
	);
}

/**
 * Complete a plugin slug.
 *
 * @return {string[]} Candidates.
 */
export function completePlugin() {
	return dirs( './projects/plugins' );
}

/**
 * Positionals that mean the same thing in every command, completed by name.
 */
const byName = { project: completeProject, plugin: completePlugin };

/**
 * Parse the positionals out of a yargs command string such as `clean [project] [include]`.
 *
 * @param {string} command - The command string.
 * @return {{ name: string, variadic: boolean }[]} Positionals, in order.
 */
export function parsePositionals( command ) {
	return Array.from( command.matchAll( /[<[]([^>\]]+)[>\]]/g ), ( [ , token ] ) => ( {
		name: token.replace( /\.\.\.$/, '' ),
		variadic: token.endsWith( '...' ),
	} ) );
}

/**
 * Find the positional that the word being completed belongs to.
 *
 * Same arithmetic as yargs: `words` is `argv._`, i.e. the program name, the command words and the
 * positional words typed so far, the last of which is the one being completed.
 *
 * @param {string}   command - The active command string, e.g. `build [project...]`.
 * @param {string[]} words   - `argv._`.
 * @param {number}   depth   - How many of `words` are command words.
 * @return {{ name: string, variadic: boolean }|undefined} The positional, if the word is one.
 */
export function positionalFor( command, words, depth ) {
	const index = words.length - depth - 2;
	if ( index < 0 ) {
		return undefined;
	}
	const positionals = parsePositionals( command );
	const last = positionals.at( -1 );
	return positionals[ index ] ?? ( last?.variadic ? last : undefined );
}

/**
 * Candidates for the positional being completed, if any.
 *
 * @param {object} yargs      - The yargs instance.
 * @param {object} completers - The command's own completers, see `completionHook()`.
 * @param {string} current    - The word being completed.
 * @param {object} argv       - Parsed arguments.
 * @return {string[]} Candidates that match the word being completed.
 */
function positionalCompletions( yargs, completers, current, argv ) {
	// The resolved command chain is only exposed through yargs' internal context; the integration
	// tests catch a yargs upgrade changing that.
	const { commands, fullCommands } = yargs.getInternalMethods().getContext();
	if ( commands.length === 0 ) {
		return [];
	}
	const positional = positionalFor( fullCommands.at( -1 ), argv._, commands.length );
	const completer = positional && ( completers[ positional.name ] ?? byName[ positional.name ] );
	if ( ! completer ) {
		return [];
	}

	const candidates = completer( current );
	if ( ! Array.isArray( candidates ) ) {
		throw new TypeError(
			`Completer for \`${ positional.name }\` must return an array synchronously.`
		);
	}

	const earlier = argv._.slice( commands.length + 1, -1 );
	// Escaped for every shell but fish, as yargs does with `choices`.
	const isFish = ( process.env.SHELL ?? '' ).includes( 'fish' );
	return candidates
		.filter(
			candidate =>
				matchesCurrent( candidate, current ) &&
				! ( positional.variadic && earlier.includes( candidate ) )
		)
		.map( candidate => ( isFish ? candidate : candidate.replace( /[\\:]/g, '\\$&' ) ) );
}

/**
 * Whether a candidate matches the word being completed.
 *
 * The name in `type/name` matches anywhere in it: `sdk` selects `js-packages/premium-analytics-sdk`.
 *
 * @param {string} candidate - One completion candidate.
 * @param {string} current   - The word being completed.
 * @return {boolean} Whether the candidate matches.
 */
function matchesCurrent( candidate, current ) {
	if ( candidate.startsWith( current ) ) {
		return true;
	}
	const slash = candidate.indexOf( '/' );
	return slash > 0 && candidate.slice( slash + 1 ).includes( current );
}

/**
 * Create the hook for `yargs.completion()` that completes positionals.
 *
 * `byName` covers every command; a builder registers the hook again with its own completers.
 * Completers must be synchronous: until the hook prints, yargs may run the half-typed command.
 *
 * @param {object} yargs      - The yargs instance, the root or the one a builder receives.
 * @param {object} completers - Positional name to `current => string[]`, overriding `byName`.
 * @return {Function} The hook, in yargs' "fallback" form.
 */
export function completionHook( yargs, completers = {} ) {
	return ( current, argv, completionFilter, done ) => {
		completionFilter( ( err, defaults = [] ) => {
			let extra = [];
			if ( ! err && ! current.startsWith( '-' ) ) {
				try {
					extra = positionalCompletions( yargs, completers, current, argv );
				} catch ( error ) {
					console.error( error );
				}
			}
			// An empty word completes to values when there are any, and to options on a dash, as yargs
			// already does for commands.
			const all = [ ...defaults, ...extra ];
			const values = current === '' ? all.filter( c => ! c.startsWith( '-' ) ) : [];
			done( values.length ? values : all );
		} );
	};
}
