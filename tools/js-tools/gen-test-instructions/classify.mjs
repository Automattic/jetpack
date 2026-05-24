/**
 * Deterministic per-PR classification + pre-AI coverage report.
 *
 * `classifyPR` produces one record per PR; that record both seeds the pre-AI
 * coverage report and is fed to the AI prompts so the model never re-infers
 * environment, accounts, or grouping from free text. The coverage-AI stage
 * (coverage-ai.mjs) layers on top of this, returning overrides that the
 * pipeline merges back into the deterministic record.
 */

// ============================================================================
// Tester-environment classifiers. Keyword lists are case-insensitive substring
// matches against a PR's testing instructions; a single hit promotes the PR
// into the relevant bucket.
// ============================================================================

export const ENGINEER_KEYWORDS = [
	{
		label: 'WPCOM sandbox + wpsh',
		patterns: [ 'wpcom sandbox', 'sandboxed wp.com', 'wpcom-sandbox', 'wpsh ' ],
	},
	{
		label: 'Jetpack rsync / WoA dev pool',
		patterns: [ 'jetpack rsync', 'dev pool', 'woa dev', 'pressable-staging' ],
	},
	{
		label: 'Gutenberg experiment flag',
		patterns: [ 'gutenberg experiment', 'experimental flag', 'workflow palette experiment' ],
	},
];

export const EXTERNAL_ACCOUNT_KEYWORDS = [
	{ account: 'Stripe', patterns: [ 'stripe account', 'stripe connect', 'stripe api' ] },
	{ account: 'MailPoet', patterns: [ 'mailpoet account', 'mailpoet subscription' ] },
	{
		account: 'PayPal pro',
		patterns: [ 'paypal account', 'professional paypal', 'paypal business' ],
	},
	{ account: 'Mailchimp', patterns: [ 'mailchimp account' ] },
	{ account: 'OpenTable', patterns: [ 'opentable account' ] },
	{ account: 'Nextdoor', patterns: [ 'nextdoor account' ] },
	{ account: 'Discord webhook', patterns: [ 'discord webhook' ] },
	{ account: 'LinkedIn connection', patterns: [ 'linkedin connection', 'linkedin account' ] },
];

// Phrases that signal a vague, un-actionable acceptance criterion in a PR's
// testing instructions. Surfaced to the user via the coverage report and the
// post-AI validation pass; the AI is also instructed to rewrite them.
// [from comments — Mike Stott's 15.3 "I'm not sure what that means" was a
// direct response to copy-pasted passive-voice criteria.]
export const FORBIDDEN_PHRASES_REGEX =
	/\b(smoke test|test thoroughly|verify it works|should be properly applied|as expected|make sure everything works|exploratory testing|everything should work as before)\b/i;

// Concrete imperative verbs we look for when distinguishing "partial" prose
// from purely vague instructions.
export const CONCRETE_ACTION_REGEX =
	/\b(click|open|navigate|toggle|select|enter|publish|save|set|configure|enable|disable|add|remove|create|edit|view|run|verify|confirm|check|load|upload|drag|drop|press|tap|switch|reload|refresh)\b/i;

// File-path patterns that mark a PR as touching tester-facing surfaces.
// First match wins for `user_facing_paths`; `package_only` requires every
// changed file to live under projects/packages/ with no plugin-level glue.
export const USER_FACING_PATH_REGEX =
	/^projects\/plugins\/jetpack\/(src|extensions|modules|views|_inc|blocks)\/|^projects\/packages\/(forms|jetpack-mu-wpcom|social|videopress|search|boost|protect|backup|crm|jetpack-ai-client|connection-ui|jitm|my-jetpack|publicize|likes|sharedaddy|sync|stats-admin|wordads)\//;

export const COMPOSER_OR_LOCK_FILE_REGEX =
	/(^|\/)(composer\.(json|lock)|package\.json|pnpm-lock\.yaml|yarn\.lock)$/;

// Allowed values per classification field. Exported so coverage-ai.mjs can
// validate AI overrides against the same vocabulary — the AI may not invent
// new buckets.
export const TESTING_INSTRUCTIONS_QUALITY_VALUES = [ 'structured', 'partial', 'vague', 'absent' ];

export const SIGNAL_KEYS = [
	'security',
	'release_priority',
	'user_facing_paths',
	'package_only',
	'dependency_bump',
	'composer_only',
	'revert',
	'large_diff',
];

/**
 * Classify a PR's testing-instructions text for tester-environment requirements.
 * Returns the first matched engineer-environment label (if any) and a deduped list of
 * named external accounts the tester would need.
 *
 * @param {string} testingInstructions - PR testing instructions text (may be empty/null).
 * @return {{ engineer_environment: string|null, external_accounts: string[] }} Engineer-environment
 * label (null if any tester can run the PR) and a deduped list of named external accounts.
 */
export function classifyEnvironmentRequirements( testingInstructions ) {
	const text = ( testingInstructions || '' ).toLowerCase();
	if ( ! text ) {
		return { engineer_environment: null, external_accounts: [] };
	}

	let engineer = null;
	for ( const bucket of ENGINEER_KEYWORDS ) {
		if ( bucket.patterns.some( p => text.includes( p ) ) ) {
			engineer = bucket.label;
			break;
		}
	}

	const accounts = [];
	for ( const bucket of EXTERNAL_ACCOUNT_KEYWORDS ) {
		if (
			bucket.patterns.some( p => text.includes( p ) ) &&
			! accounts.includes( bucket.account )
		) {
			accounts.push( bucket.account );
		}
	}

	return { engineer_environment: engineer, external_accounts: accounts };
}

/**
 * Deterministic per-PR classification. Runs after fetchPRDetails(), before any
 * AI involvement. The returned record both seeds the pre-AI coverage report
 * and is passed verbatim to the AI prompt so the model never re-infers
 * environment, accounts, or grouping from free text.
 *
 * @param {object} prDetail       - PR object from fetchPRDetails().
 * @param {object} changelogEntry - Matching changelog entry (for one-line text).
 * @return {object} Classification record.
 */
export function classifyPR( prDetail, changelogEntry ) {
	const {
		number,
		title,
		body,
		testingInstructions,
		labels = [],
		author,
		additions = 0,
		deletions = 0,
		files = [],
	} = prDetail;

	const labelNames = labels.map( l => String( l ).toLowerCase() );

	// Testing-instruction quality.
	let quality = 'absent';
	if ( testingInstructions ) {
		const numberedSteps = ( testingInstructions.match( /^\s*\d+\.\s/gm ) || [] ).length;
		const hasForbidden = FORBIDDEN_PHRASES_REGEX.test( testingInstructions );
		const hasConcreteAction = CONCRETE_ACTION_REGEX.test( testingInstructions );
		if ( numberedSteps >= 2 ) {
			quality = 'structured';
		} else if ( hasConcreteAction && ! hasForbidden ) {
			quality = 'partial';
		} else if ( hasConcreteAction ) {
			// Has both concrete actions and forbidden phrases — mixed, mark partial
			// so the AI still tries, but the report flags it.
			quality = 'partial';
		} else {
			quality = 'vague';
		}
	}

	// Environment + external accounts (existing keyword classifier).
	const env = classifyEnvironmentRequirements( testingInstructions || body || '' );

	// File-path signals.
	const userFacing = files.some( p => USER_FACING_PATH_REGEX.test( p ) );
	const packageOnly =
		files.length > 0 &&
		files.every( p => p.startsWith( 'projects/packages/' ) ) &&
		! files.some( p => /^projects\/plugins\/jetpack\/changelog\//.test( p ) );
	const composerOnly =
		files.length > 0 && files.every( p => COMPOSER_OR_LOCK_FILE_REGEX.test( p ) );

	// Title / label signals.
	const dependencyBump =
		/^Update dependency\b|^Lock file maintenance\b|^Update [^:]+ to v?\d/i.test( title );
	const revert = /^Revert /i.test( title );
	const largeDiff = additions + deletions > 500;
	const security = labelNames.some( l => /security|vulnerability/.test( l ) );
	const releasePriority = labelNames.some( l =>
		/release[-/ ]priority|priority[-/](high|p1)|\[priority\]\s*(high|p1)/.test( l )
	);

	// Consolidation hint: title prefix before the first colon, e.g. "Donations".
	const hintMatch = title.match( /^([A-Z][\w &/+-]{1,30}):\s/ );
	const consolidationHint = hintMatch ? hintMatch[ 1 ].trim() : null;

	return {
		pr: number,
		title,
		author,
		labels: labelNames,
		diff_stats: { files_changed: files.length, additions, deletions },
		testing_instructions_quality: quality,
		engineer_environment: env.engineer_environment,
		external_accounts: env.external_accounts,
		signals: {
			security,
			release_priority: releasePriority,
			user_facing_paths: userFacing,
			package_only: packageOnly,
			dependency_bump: dependencyBump,
			composer_only: composerOnly,
			revert,
			large_diff: largeDiff,
		},
		consolidation_hint: consolidationHint,
		// Source data carried for the AI prompt (not part of the public schema).
		testing_instructions: testingInstructions || null,
		changelog_text: changelogEntry?.text || null,
	};
}

/**
 * Pretty-print the pre-AI coverage report to stderr so the user can see what
 * the tool is about to feed the AI before any tokens are spent.
 *
 * @param {Array} classifications - Output of classifyPR() (or the merged set after coverage-AI) for every in-scope PR.
 * @return {void}
 */
export function printPreAICoverageReport( classifications ) {
	const total = classifications.length;
	const prList = nums => ( nums.length === 0 ? '' : ' ' + nums.map( n => `#${ n }` ).join( ', ' ) );

	const byQuality = { structured: [], partial: [], vague: [], absent: [] };
	for ( const c of classifications ) {
		byQuality[ c.testing_instructions_quality ].push( c.pr );
	}

	// Environment groupings.
	const envBuckets = new Map();
	for ( const c of classifications ) {
		if ( c.engineer_environment ) {
			const arr = envBuckets.get( c.engineer_environment ) || [];
			arr.push( c.pr );
			envBuckets.set( c.engineer_environment, arr );
		}
	}
	const accountBuckets = new Map();
	for ( const c of classifications ) {
		for ( const acct of c.external_accounts ) {
			const arr = accountBuckets.get( acct ) || [];
			arr.push( c.pr );
			accountBuckets.set( acct, arr );
		}
	}

	// Importance signals.
	const sigBuckets = {
		security: [],
		release_priority: [],
		user_facing_paths: [],
		package_only: [],
		dependency_bump: [],
		composer_only: [],
		revert: [],
		large_diff: [],
	};
	for ( const c of classifications ) {
		for ( const key of Object.keys( sigBuckets ) ) {
			if ( c.signals[ key ] ) {
				sigBuckets[ key ].push( c.pr );
			}
		}
	}

	// Consolidation hints.
	const hintBuckets = new Map();
	const noHint = [];
	for ( const c of classifications ) {
		if ( c.consolidation_hint ) {
			const arr = hintBuckets.get( c.consolidation_hint ) || [];
			arr.push( c.pr );
			hintBuckets.set( c.consolidation_hint, arr );
		} else {
			noHint.push( c.pr );
		}
	}

	const lines = [];
	lines.push( '' );
	lines.push( `📊 Coverage of testing instructions — ${ total } PRs in scope` );
	lines.push( '' );
	lines.push( 'Testing-instruction quality:' );
	lines.push( `  ✅ structured: ${ String( byQuality.structured.length ).padStart( 3 ) }` );
	lines.push( `  ⚠️  partial:    ${ String( byQuality.partial.length ).padStart( 3 ) }` );
	lines.push(
		`  ❌ vague:       ${ String( byQuality.vague.length ).padStart( 3 ) }${ prList(
			byQuality.vague
		) }`
	);
	lines.push(
		`  ⛔ absent:      ${ String( byQuality.absent.length ).padStart( 3 ) }${ prList(
			byQuality.absent
		) }`
	);
	lines.push( '' );

	if ( envBuckets.size > 0 || accountBuckets.size > 0 ) {
		lines.push( 'Environment requirements:' );
		if ( envBuckets.size > 0 ) {
			const totalEnv = [ ...envBuckets.values() ].reduce( ( a, b ) => a + b.length, 0 );
			lines.push( `  🔧 engineer env (${ totalEnv } PRs):` );
			for ( const [ label, prs ] of envBuckets ) {
				lines.push( `       - ${ label }: ${ prs.length } PR(s)${ prList( prs ) }` );
			}
		}
		if ( accountBuckets.size > 0 ) {
			const totalAcct = [ ...accountBuckets.values() ].reduce( ( a, b ) => a + b.length, 0 );
			lines.push( `  💳 external accounts (${ totalAcct } PR-account pairs):` );
			for ( const [ acct, prs ] of accountBuckets ) {
				lines.push( `       - ${ acct }: ${ prs.length } PR(s)${ prList( prs ) }` );
			}
		}
		lines.push( '' );
	}

	lines.push( 'Importance signals (any-of):' );
	const sigLabel = {
		security: '🔒 security        ',
		release_priority: '⭐ release-priority',
		user_facing_paths: '🟢 user-facing     ',
		package_only: '📦 package-only    ',
		dependency_bump: '🧹 dependency bump ',
		composer_only: '🔗 composer-only   ',
		revert: '⏪ revert          ',
		large_diff: '📏 large diff (>500)',
	};
	for ( const key of Object.keys( sigBuckets ) ) {
		const prs = sigBuckets[ key ];
		if ( prs.length === 0 ) {
			continue;
		}
		// Only inline PR list for low-volume signals to keep the report readable.
		const inline = prs.length <= 6 ? prList( prs ) : '';
		lines.push( `  ${ sigLabel[ key ] }: ${ String( prs.length ).padStart( 3 ) } PRs${ inline }` );
	}
	lines.push( '' );

	lines.push( 'Consolidation hints (from title prefixes):' );
	const sortedHints = [ ...hintBuckets.entries() ].sort(
		( a, b ) => b[ 1 ].length - a[ 1 ].length
	);
	for ( const [ hint, prs ] of sortedHints ) {
		const inline = prs.length <= 6 ? prList( prs ) : '';
		lines.push( `  ${ hint }: ${ String( prs.length ).padStart( 3 ) } PRs${ inline }` );
	}
	if ( noHint.length > 0 ) {
		lines.push( `  (no hint): ${ String( noHint.length ).padStart( 3 ) } PRs` );
	}
	lines.push( '' );

	process.stderr.write( lines.join( '\n' ) + '\n' );
}
