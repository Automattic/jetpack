const assert = require( 'assert' );
const core = require( '@actions/core' );
const { SError } = require( 'error' );
const picomatch = require( 'picomatch' );
const fetchTeamMembers = require( './team-members.js' );

class RequirementError extends SError {}

/**
 * Prints a result set, then returns it.
 *
 * @param {string} label - Label for the set.
 * @param {string[]} items - Items to print. If an empty array, will print `<empty set>` instead.
 * @returns {string[]} `items`.
 */
function printSet( label, items ) {
	core.info( label + ' ' + ( items.length ? items.join( ', ' ) : '<empty set>' ) );
	return items;
}

/**
 * Build a reviewer team membership filter.
 *
 * @param {object} config - Requirements configuration object being processed.
 * @param {Array|string|object} teamConfig - Team name, or single-key object with a list of teams/objects, or array of such.
 * @param {string} indent - String for indentation.
 * @returns {Function} Function to filter an array of reviewers by membership in the team(s).
 */
function buildReviewerFilter( config, teamConfig, indent ) {
	if ( typeof teamConfig === 'string' ) {
		const team = teamConfig;
		return async function ( reviewers ) {
			const members = await fetchTeamMembers( team );
			return printSet(
				`${ indent }Members of ${ team }:`,
				reviewers.filter( reviewer => members.includes( reviewer ) )
			);
		};
	}

	let keys;
	try {
		keys = Object.keys( teamConfig );
		assert( keys.length === 1 );
	} catch {
		throw new RequirementError( 'Expected a team name or a single-keyed object.', {
			config: config,
			value: teamConfig,
		} );
	}

	const op = keys[ 0 ];
	let arg = teamConfig[ op ];

	switch ( op ) {
		case 'any-of':
		case 'all-of':
			// These ops require an array of teams/objects.
			if ( ! Array.isArray( arg ) ) {
				throw new RequirementError( `Expected an array of teams, got ${ typeof arg }`, {
					config: config,
					value: arg,
				} );
			}
			if ( ! arg.length === 0 ) {
				throw new RequirementError( 'Expected a non-empty array of teams', {
					config: config,
					value: teamConfig,
				} );
			}
			arg = arg.map( t => buildReviewerFilter( config, t, `${ indent }  ` ) );
			break;

		default:
			throw new RequirementError( `Unrecognized operation "${ op }"`, {
				config: config,
				value: teamConfig,
			} );
	}

	if ( op === 'any-of' ) {
		return async function ( reviewers ) {
			core.info( `${ indent }Union of these:` );
			return printSet( `${ indent }=>`, [
				...new Set(
					( await Promise.all( arg.map( f => f( reviewers, `${ indent }  ` ) ) ) ).flat( 1 )
				),
			] );
		};
	}

	if ( op === 'all-of' ) {
		return async function ( reviewers ) {
			core.info( `${ indent }Union of these, if none are empty:` );
			const filtered = await Promise.all( arg.map( f => f( reviewers, `${ indent }  ` ) ) );
			if ( filtered.some( a => a.length === 0 ) ) {
				return printSet( `${ indent }=>`, [] );
			}
			return printSet( `${ indent }=>`, [ ...new Set( filtered.flat( 1 ) ) ] );
		};
	}

	// WTF?
	throw new RequirementError( `Unrecognized operation "${ op }"`, {
		config: config,
		value: teamConfig,
	} );
}

/**
 * Class representing an individual requirement.
 */
class Requirement {
	/**
	 * Constructor.
	 *
	 * @param {object} config - Object config
	 * @param {string[]|string} config.paths - Paths this requirement applies to. Either an array of picomatch globs, or the string "unmatched".
	 * @param {Array} config.teams - Team reviews requirements.
	 */
	constructor( config ) {
		this.name = config.name || 'Unnamed requirement';

		if ( config.paths === 'unmatched' ) {
			this.pathsFilter = null;
		} else if (
			Array.isArray( config.paths ) &&
			config.paths.length > 0 &&
			config.paths.every( v => typeof v === 'string' )
		) {
			// picomatch doesn't combine multiple negated patterns in a way that makes sense here: `!a` and `!b` will pass both `a` and `b`
			// because `a` matches `!b` and `b` matches `!a`. So instead we have to handle the negation ourself: test the (non-negated) patterns in order,
			// with the last match winning. If none match, the opposite of the first pattern's negation is what we need.
			const filters = config.paths.map( path => {
				if ( path.startsWith( '!' ) ) {
					return {
						negated: true,
						filter: picomatch( path.substring( 1 ), { dot: true, nonegate: true } ),
					};
				}
				return {
					negated: false,
					filter: picomatch( path, { dot: true } ),
				};
			} );
			const first = filters.shift();
			this.pathsFilter = v => {
				let ret = first.filter( v ) ? ! first.negated : first.negated;
				for ( const filter of filters ) {
					if ( filter.filter( v ) ) {
						ret = ! filter.negated;
					}
				}
				return ret;
			};
		} else {
			throw new RequirementError(
				'Paths must be a non-empty array of strings, or the string "unmatched".',
				{
					config: config,
				}
			);
		}

		this.reviewerFilter = buildReviewerFilter( config, { 'any-of': config.teams }, '  ' );
	}

	/**
	 * Test whether this requirement applies to the passed paths.
	 *
	 * @param {string[]} paths - Paths to test against.
	 * @param {string[]} matchedPaths - Paths that have already been matched. Will be modified if true is returned.
	 * @returns {boolean} Whether the requirement applies.
	 */
	appliesToPaths( paths, matchedPaths ) {
		let matches;
		if ( this.pathsFilter ) {
			matches = paths.filter( p => this.pathsFilter( p ) );
		} else {
			matches = paths.filter( p => ! matchedPaths.includes( p ) );
			if ( matches.length === 0 ) {
				core.info( "Matches files that haven't been matched yet, but all files have." );
			}
		}

		if ( matches.length !== 0 ) {
			core.info( 'Matches the following files:' );
			matches.forEach( m => core.info( `   - ${ m }` ) );
			matchedPaths.push( ...matches.filter( p => ! matchedPaths.includes( p ) ) );
			matchedPaths.sort();
		}

		return matches.length !== 0;
	}

	/**
	 * Test whether this requirement is satisfied.
	 *
	 * @param {string[]} reviewers - Reviewers to test against.
	 * @returns {boolean} Whether the requirement is satisfied.
	 */
	async isSatisfied( reviewers ) {
		core.info( 'Checking reviewers...' );
		return ( await this.reviewerFilter( reviewers ) ).length > 0;
	}
}

module.exports = Requirement;
