/**
 * Human-in-the-loop prompts.
 *
 * Two checkpoints. promptUserForExclusions runs pre-AI to let the user trim
 * low-value PRs out of scope. promptForDecisions runs post-reviewer to let
 * the user pick between options the reviewer surfaced as "needs human
 * judgment". The latter throws DecisionsPendingError when stdin is not a TTY
 * or --non-interactive was passed, so the orchestrator can persist the open
 * decisions to the coverage sidecar and exit with EXIT_CODE_DECISIONS_PENDING.
 */

/**
 * Thrown by promptForDecisions when there are decisions to surface but no TTY
 * is available (or --non-interactive was set). The orchestrator catches this
 * and routes the decisions to the coverage sidecar.
 */
export class DecisionsPendingError extends Error {
	constructor( decisions ) {
		super(
			`${ decisions.length } reviewer decision(s) require a human; pass --interactive (default TTY) to resolve them.`
		);
		this.name = 'DecisionsPendingError';
		this.decisions = decisions;
	}
}

/**
 * Interactively ask the user which PRs to EXCLUDE from the AI consolidation
 * pass. Excluded PRs land in "Other PRs" automatically (no invented prose).
 * Returns the set of PR numbers to exclude.
 *
 * Skipped when stdin is not a TTY or when the caller passed --non-interactive.
 *
 * @param {Array} classifications - Pre-AI classification records.
 * @return {Promise<Set<number>>} Set of PR numbers the user chose to exclude.
 */
export async function promptUserForExclusions( classifications ) {
	const readline = await import( 'readline' );
	const rl = readline.createInterface( { input: process.stdin, output: process.stderr } );
	const ask = q => new Promise( resolve => rl.question( q, resolve ) );

	const lowValue = classifications.filter(
		c =>
			c.testing_instructions_quality === 'vague' ||
			c.testing_instructions_quality === 'absent' ||
			c.signals.dependency_bump ||
			c.signals.composer_only ||
			c.signals.revert
	);

	process.stderr.write(
		`\n${ lowValue.length } PRs look low-value for the AI pass (vague/absent instructions or deps/reverts).\n`
	);
	const proceed = await ask( 'Include ALL PRs in the AI pass? [Y/n/list] ' );
	const choice = ( proceed || '' ).trim().toLowerCase();

	if ( choice === 'n' || choice === 'no' ) {
		const csv = await ask(
			'\nComma-separated PR numbers to EXCLUDE (Enter to skip; "low" to drop all low-value): '
		);
		rl.close();
		const trimmed = ( csv || '' ).trim();
		if ( ! trimmed ) {
			return new Set();
		}
		if ( trimmed.toLowerCase() === 'low' ) {
			return new Set( lowValue.map( c => c.pr ) );
		}
		const nums = trimmed
			.split( /[\s,]+/ )
			.map( s => parseInt( s.replace( /^#/, '' ), 10 ) )
			.filter( n => Number.isInteger( n ) );
		return new Set( nums );
	}

	if ( choice === 'list' ) {
		process.stderr.write( '\nLow-value PRs (consider excluding):\n' );
		for ( const c of lowValue ) {
			process.stderr.write(
				`  #${ c.pr } [${ c.testing_instructions_quality }] ${ c.title.slice( 0, 80 ) }\n`
			);
		}
		const csv = await ask( '\nComma-separated PR numbers to EXCLUDE (Enter to include all): ' );
		rl.close();
		const trimmed = ( csv || '' ).trim();
		if ( ! trimmed ) {
			return new Set();
		}
		const nums = trimmed
			.split( /[\s,]+/ )
			.map( s => parseInt( s.replace( /^#/, '' ), 10 ) )
			.filter( n => Number.isInteger( n ) );
		return new Set( nums );
	}

	rl.close();
	return new Set();
}

/**
 * Interactively walk the user through the reviewer's open decisions and
 * collect answers. Each decision has a free-text summary, a `suggested_fix`,
 * and (optionally) a small list of `options` the reviewer enumerated. The
 * user can pick one of the options by number, type a free-form answer, or
 * press Enter to defer.
 *
 * Returns an array of `{ pr_numbers, answer }` records, one per decision the
 * user resolved (deferred decisions are omitted). The orchestrator passes
 * those answers back into the plan-regenerator's prompt.
 *
 * @param {Array}   decisions              - Reviewer decisions (see reviewer.mjs schema).
 * @param {object}  options                - Behavior flags.
 * @param {boolean} options.nonInteractive - When true (or no TTY), throw DecisionsPendingError.
 * @return {Promise<Array<{ pr_numbers: number[], summary: string, answer: string }>>} One record per decision the user resolved.
 */
export async function promptForDecisions( decisions, { nonInteractive = false } = {} ) {
	if ( ! Array.isArray( decisions ) || decisions.length === 0 ) {
		return [];
	}

	if ( nonInteractive || ! process.stdin.isTTY ) {
		throw new DecisionsPendingError( decisions );
	}

	const readline = await import( 'readline' );
	const rl = readline.createInterface( { input: process.stdin, output: process.stderr } );
	const ask = q => new Promise( resolve => rl.question( q, resolve ) );

	process.stderr.write(
		`\n🙋 Reviewer surfaced ${ decisions.length } decision(s) that need human judgment.\n` +
			'For each one: type an option number, write a free-form answer, or press Enter to defer.\n'
	);

	const answers = [];
	for ( let i = 0; i < decisions.length; i++ ) {
		const d = decisions[ i ];
		const prList =
			Array.isArray( d.pr_numbers ) && d.pr_numbers.length > 0
				? ' (' + d.pr_numbers.map( n => `#${ n }` ).join( ', ' ) + ')'
				: '';
		process.stderr.write(
			`\n[${ i + 1 }/${ decisions.length }]${ prList } ${ d.summary || '(no summary)' }\n`
		);
		if ( d.suggested_fix ) {
			process.stderr.write( `   suggested: ${ d.suggested_fix }\n` );
		}
		const opts = Array.isArray( d.options ) ? d.options : [];
		opts.forEach( ( opt, idx ) => {
			process.stderr.write( `   ${ idx + 1 }) ${ opt }\n` );
		} );

		const reply = await ask( '> ' );
		const trimmed = ( reply || '' ).trim();
		if ( ! trimmed ) {
			continue;
		}
		// If the user typed a number that matches one of the options, expand to the option text.
		let answer = trimmed;
		const asInt = parseInt( trimmed, 10 );
		if ( Number.isInteger( asInt ) && asInt >= 1 && asInt <= opts.length ) {
			answer = opts[ asInt - 1 ];
		}
		answers.push( {
			pr_numbers: Array.isArray( d.pr_numbers ) ? d.pr_numbers : [],
			summary: d.summary || '',
			answer,
		} );
	}

	rl.close();
	return answers;
}
