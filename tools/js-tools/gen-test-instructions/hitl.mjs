/**
 * Human-in-the-loop prompts.
 *
 * Two checkpoints. selectLowValuePrs + promptUserForExclusions run pre-AI to
 * let the user trim low-value PRs out of scope. promptForDecisions runs
 * post-reviewer to let the user pick between options the reviewer surfaced as
 * "needs human judgment".
 *
 * Both checkpoints behave the same in non-interactive mode as a user pressing
 * Enter on every prompt: exclusions are applied (interactive default is Y),
 * and each decision auto-picks its `recommended_option` (the ★ default). The
 * pipeline logs every auto-applied choice to stderr and records it in the
 * coverage sidecar so the audit trail is identical to an interactive run.
 */

/**
 * Pick the PRs the pre-AI scope prompt would offer to exclude — vague/absent
 * testing instructions, dependency bumps, composer-only changes, and reverts.
 * Shared by interactive (promptUserForExclusions) and non-interactive callers.
 *
 * @param {Array} classifications - Pre-AI classification records.
 * @return {Array} Subset of classifications considered low-value for AI planning.
 */
export function selectLowValuePrs( classifications ) {
	return classifications.filter(
		c =>
			c.testing_instructions_quality === 'vague' ||
			c.testing_instructions_quality === 'absent' ||
			c.signals.dependency_bump ||
			c.signals.composer_only ||
			c.signals.revert
	);
}

/**
 * Interactively ask the user whether to exclude the auto-detected low-value
 * PRs (vague/absent testing instructions, dependency bumps, reverts) from the
 * AI consolidation pass. Excluded PRs land in "Other PRs" automatically (no
 * invented prose). Defaults to excluding them — press Enter to accept.
 *
 * Caller is responsible for only calling this when stdin is a TTY and the user
 * did not pass --non-interactive; non-interactive callers should apply
 * selectLowValuePrs directly (that's what pressing Enter would do).
 *
 * @param {Array} classifications - Pre-AI classification records.
 * @return {Promise<Set<number>>} Set of PR numbers the user chose to exclude.
 */
export async function promptUserForExclusions( classifications ) {
	const lowValue = selectLowValuePrs( classifications );
	if ( lowValue.length === 0 ) {
		return new Set();
	}

	const readline = await import( 'readline' );
	const rl = readline.createInterface( { input: process.stdin, output: process.stderr } );
	const ask = q => new Promise( resolve => rl.question( q, resolve ) );

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
 * Apply the interactive default to each decision without prompting. Mirrors
 * what an interactive run would do if the user pressed Enter on every prompt:
 * pick `recommended_option` (or option 1 when invalid/missing) for decisions
 * that have options, skip decisions with no options. Logs every applied (and
 * skipped) choice to stderr so the user can audit the run from the terminal
 * output just like an interactive session.
 *
 * @param {string} text - Recommended option text.
 * @return {boolean} True when the option contains a branch that needs human judgment.
 */
export function isConditionalDecisionOption( text ) {
	if ( typeof text !== 'string' ) {
		return false;
	}
	return /\b(if|otherwise|rather than|instead of|correct the classification|looks wrong)\b/i.test(
		text
	);
}

/**
 * Apply non-interactive defaults where doing so is safe. Conditional
 * recommendations are not auto-applied because the default may choose the
 * wrong branch while still looking "resolved" in the sidecar.
 *
 * @param {Array}   decisions   - Reviewer decisions.
 * @param {object}  options     - Behavior flags.
 * @param {boolean} options.log - Whether to print decisions to stderr.
 * @return {object} Resolved answers plus manual gates.
 */
export function resolveNonInteractiveDecisions( decisions, { log = false } = {} ) {
	const width = Math.max( 40, process.stderr.columns || 80 );
	const answers = [];
	const unresolved = [];

	if ( log ) {
		process.stderr.write(
			`\n🤖 ${ decisions.length } decision${
				decisions.length === 1 ? '' : 's'
			} — auto-applying safe interactive defaults (--non-interactive):\n`
		);
	}

	for ( let i = 0; i < decisions.length; i++ ) {
		const d = decisions[ i ];
		const opts = Array.isArray( d.options ) ? d.options : [];
		const prTag =
			Array.isArray( d.pr_numbers ) && d.pr_numbers.length > 0
				? ` ${ d.pr_numbers.map( n => `#${ n }` ).join( ', ' ) }`
				: '';
		const header = `  ${ i + 1 }.${ prTag } ${ d.summary || '(no summary)' }`;
		if ( log ) {
			process.stderr.write( wrapToWidth( header, width, '' ) + '\n' );
		}

		if ( opts.length === 0 ) {
			if ( log ) {
				process.stderr.write( '     → unresolved (no options to auto-resolve)\n' );
			}
			unresolved.push( {
				...d,
				reason: 'No concrete options were provided for non-interactive resolution.',
			} );
			continue;
		}

		const defaultIdx =
			Number.isInteger( d.recommended_option ) &&
			d.recommended_option >= 1 &&
			d.recommended_option <= opts.length
				? d.recommended_option
				: 1;
		const answer = opts[ defaultIdx - 1 ];

		if ( isConditionalDecisionOption( answer ) ) {
			if ( log ) {
				process.stderr.write(
					wrapToWidth(
						`     → unresolved (conditional option ${ defaultIdx } needs human review): ${ answer }`,
						width,
						''
					) + '\n'
				);
			}
			unresolved.push( {
				...d,
				recommended_answer: answer,
				reason: 'Recommended option is conditional and cannot be safely auto-applied.',
			} );
			continue;
		}

		if ( log ) {
			process.stderr.write(
				wrapToWidth( `     → ★ option ${ defaultIdx }: ${ answer }`, width, '' ) + '\n'
			);
		}
		answers.push( {
			pr_numbers: Array.isArray( d.pr_numbers ) ? d.pr_numbers : [],
			summary: d.summary || '',
			answer,
			expected_effects: Array.isArray( d.expected_effects ) ? d.expected_effects : [],
		} );
	}

	return { answers, unresolved };
}

/**
 * Resolve decisions in non-interactive mode and log the outcome.
 *
 * @param {Array} decisions - Reviewer decisions.
 * @return {object} Resolved decisions.
 */
function autoResolveDecisions( decisions ) {
	return resolveNonInteractiveDecisions( decisions, { log: true } );
}

/**
 * Resolve the reviewer's open decisions. Each decision has a free-text
 * summary, a small list of `options` the reviewer enumerated (each option
 * label is itself plan-actionable), and a `recommended_option` (1-based index)
 * that drives the default.
 *
 * Interactive (TTY, not --non-interactive): walk the user through each
 * decision. Empty/Enter accepts the recommended default; "s" or "skip"
 * defers; an integer 1..N picks that option; any other text is recorded as a
 * free-form override.
 *
 * Non-interactive (or no TTY): auto-apply only concrete defaults. Conditional
 * recommendations and no-option decisions become unresolved process gates.
 *
 * Returns an array of `{ pr_numbers, summary, answer }` records, one per
 * decision that produced an answer (deferred + no-option decisions are
 * omitted). The orchestrator passes those answers back into the
 * plan-regenerator's prompt.
 *
 * @param {Array}   decisions              - Reviewer decisions (see reviewer.mjs schema).
 * @param {object}  options                - Behavior flags.
 * @param {boolean} options.nonInteractive - When true (or no TTY), auto-apply defaults instead of prompting.
 * @return {Promise<object>} Resolved answers plus manual gates.
 */
export async function promptForDecisions( decisions, { nonInteractive = false } = {} ) {
	if ( ! Array.isArray( decisions ) || decisions.length === 0 ) {
		return { answers: [], unresolved: [] };
	}

	if ( nonInteractive || ! process.stdin.isTTY ) {
		return autoResolveDecisions( decisions );
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
			expected_effects: Array.isArray( d.expected_effects ) ? d.expected_effects : [],
		} );
	}

	rl.close();
	return { answers, unresolved: [] };
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
