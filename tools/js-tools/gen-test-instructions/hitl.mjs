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
 * Interactively ask the user whether to exclude the auto-detected low-value
 * PRs (vague/absent testing instructions, dependency bumps, reverts) from the
 * AI consolidation pass. Excluded PRs land in "Other PRs" automatically (no
 * invented prose). Defaults to excluding them — press Enter to accept.
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

	if ( lowValue.length === 0 ) {
		rl.close();
		return new Set();
	}

	process.stderr.write(
		`\nFound ${ lowValue.length } low-value PR(s) — vague/absent testing instructions, dependency bumps, or reverts:\n`
	);
	for ( const c of lowValue ) {
		process.stderr.write(
			`  #${ c.pr } [${ c.testing_instructions_quality }] ${ c.title.slice( 0, 80 ) }\n`
		);
	}
	process.stderr.write(
		'\nExcluded PRs are dropped from AI planning and listed under "Other PRs" as-is.\n'
	);
	const reply = await ask( 'Exclude them from the planning? [Y/n] ' );
	rl.close();
	const choice = ( reply || '' ).trim().toLowerCase();

	if ( choice === 'n' || choice === 'no' ) {
		return new Set();
	}
	return new Set( lowValue.map( c => c.pr ) );
}

/**
 * Interactively walk the user through the reviewer's open decisions and
 * collect answers. Each decision has a free-text summary, a small list of
 * `options` the reviewer enumerated (each option label is itself plan-
 * actionable), and a `recommended_option` (1-based index) that drives the
 * default.
 *
 * Input handling per decision: empty/Enter accepts the recommended default;
 * "s" or "skip" defers; an integer 1..N picks that option; any other text is
 * recorded as a free-form override.
 *
 * Returns an array of `{ pr_numbers, summary, answer }` records, one per
 * decision the user resolved (deferred decisions are omitted). The orchestrator
 * passes those answers back into the plan-regenerator's prompt.
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

	const width = Math.max( 40, process.stderr.columns || 80 );
	const rule = '─'.repeat( width );

	process.stderr.write(
		`\n🙋 ${ decisions.length } decision${ decisions.length === 1 ? '' : 's' } need your input\n` +
			'   ↵ accept default (★)  ·  1-N pick option  ·  type text to override  ·  s to skip\n'
	);

	const answers = [];
	for ( let i = 0; i < decisions.length; i++ ) {
		const d = decisions[ i ];
		const opts = Array.isArray( d.options ) ? d.options : [];
		const defaultIdx =
			Number.isInteger( d.recommended_option ) &&
			d.recommended_option >= 1 &&
			d.recommended_option <= opts.length
				? d.recommended_option
				: 1;

		process.stderr.write( `\n${ rule }\n` );
		process.stderr.write( `📋 Decision ${ i + 1 } of ${ decisions.length }\n` );
		if ( Array.isArray( d.pr_numbers ) && d.pr_numbers.length > 0 ) {
			process.stderr.write( `🔖 ${ d.pr_numbers.map( n => `#${ n }` ).join( ', ' ) }\n` );
		}
		process.stderr.write( '\n' );
		process.stderr.write( wrapToWidth( d.summary || '(no summary)', width ) + '\n' );
		process.stderr.write( '\n' );

		if ( opts.length === 0 ) {
			process.stderr.write( '   (no options — type a free-form answer)\n' );
		} else {
			const indexCol = String( opts.length ).length;
			opts.forEach( ( opt, idx ) => {
				const num = String( idx + 1 ).padStart( indexCol );
				const bullet = idx + 1 === defaultIdx ? '★' : ' ';
				const prefix = `   ${ bullet } ${ num }. `;
				const wrapped = wrapToWidth( opt, width, ' '.repeat( prefix.length ) );
				const wrappedLines = wrapped.split( '\n' );
				const firstLine = wrappedLines[ 0 ].trimStart();
				const rest = wrappedLines.length > 1 ? '\n' + wrappedLines.slice( 1 ).join( '\n' ) : '';
				process.stderr.write( `${ prefix }${ firstLine }${ rest }\n` );
			} );
		}

		const promptLabel = opts.length > 0 ? '\n❯ [↵=★] ' : '\n❯ ';
		const reply = await ask( promptLabel );
		const trimmed = ( reply || '' ).trim();
		const lower = trimmed.toLowerCase();

		let answer;
		if ( ! trimmed ) {
			answer = opts[ defaultIdx - 1 ] || '';
			if ( ! answer ) {
				continue;
			}
		} else if ( lower === 's' || lower === 'skip' ) {
			continue;
		} else {
			const asInt = parseInt( trimmed, 10 );
			if ( Number.isInteger( asInt ) && asInt >= 1 && asInt <= opts.length ) {
				answer = opts[ asInt - 1 ];
			} else {
				answer = trimmed;
			}
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

/**
 * Greedy word-wrap. Splits on existing newlines so multi-paragraph input is
 * preserved, then word-wraps each paragraph to `width - indent.length` columns
 * and re-prefixes every output line with `indent`.
 *
 * @param {string} text   - Input text. May contain newlines.
 * @param {number} width  - Terminal width in columns.
 * @param {string} indent - Leading whitespace applied to every output line.
 * @return {string} Wrapped, indented text. Single string with embedded \n.
 */
export function wrapToWidth( text, width, indent = '   ' ) {
	const max = Math.max( 20, width - indent.length );
	const out = [];
	for ( const paragraph of String( text ).split( '\n' ) ) {
		const words = paragraph.split( /\s+/ ).filter( Boolean );
		if ( words.length === 0 ) {
			out.push( '' );
			continue;
		}
		let cur = '';
		for ( const w of words ) {
			if ( ! cur ) {
				cur = w;
			} else if ( cur.length + 1 + w.length > max ) {
				out.push( cur );
				cur = w;
			} else {
				cur += ' ' + w;
			}
		}
		if ( cur ) {
			out.push( cur );
		}
	}
	return out.map( l => indent + l ).join( '\n' );
}
