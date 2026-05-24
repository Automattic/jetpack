/**
 * AI CLI runners and stream-event handlers.
 *
 * These are pure I/O wrappers around the `claude -p` and `codex exec` CLIs.
 * Every AI stage (coverage-AI, plan generator, reviewer) shells out through
 * the same runner so behavior (stream output, error surfaces, tmpdir cwd)
 * stays consistent.
 */

import { spawn } from 'child_process';
import os from 'os';
import { CLAUDE_MODEL, CLAUDE_EFFORT, CODEX_MODEL, CODEX_EFFORT } from './constants.mjs';

/**
 * Truncate a string to `max` chars with an ellipsis. Newlines collapsed for one-line display.
 *
 * @param {string} s   - Source string.
 * @param {number} max - Maximum character count.
 * @return {string} Single-line, ellipsized string.
 */
export function oneLineSummary( s, max ) {
	const flat = String( s ).replace( /\s+/g, ' ' ).trim();
	return flat.length > max ? flat.slice( 0, max - 1 ) + '…' : flat;
}

/**
 * Format a tool_use block's input as a short, single-line preview.
 *
 * @param {object} input - The tool_use input object.
 * @return {string} Short preview string.
 */
export function summarizeToolInput( input ) {
	if ( ! input || typeof input !== 'object' ) {
		return '';
	}
	const preferredKeys = [
		'command',
		'file_path',
		'path',
		'query',
		'pattern',
		'url',
		'description',
	];
	for ( const key of preferredKeys ) {
		if ( typeof input[ key ] === 'string' && input[ key ] ) {
			return `${ key }: ${ oneLineSummary( input[ key ], 100 ) }`;
		}
	}
	return oneLineSummary( JSON.stringify( input ), 100 );
}

/**
 * Print an interesting stream-json event to stderr so the user can see the agent working.
 * Returns the final text if this event is the terminal `result` event, otherwise null.
 *
 * @param {object} event - Parsed JSONL event from `claude -p --output-format stream-json`.
 * @return {string|null} Final text when the result event is seen, otherwise null.
 */
export function handleStreamEvent( event ) {
	if ( ! event || typeof event !== 'object' ) {
		return null;
	}
	switch ( event.type ) {
		case 'assistant': {
			const blocks =
				event.message && Array.isArray( event.message.content ) ? event.message.content : [];
			for ( const block of blocks ) {
				if ( block.type === 'thinking' ) {
					const preview = oneLineSummary( block.thinking || '', 140 );
					console.error( preview ? `   💭 ${ preview }` : '   💭 (extended thinking)' );
				} else if ( block.type === 'redacted_thinking' ) {
					console.error( '   💭 [redacted]' );
				} else if ( block.type === 'tool_use' ) {
					console.error( `   🔧 ${ block.name }(${ summarizeToolInput( block.input ) })` );
				}
			}
			return null;
		}
		case 'user': {
			const blocks =
				event.message && Array.isArray( event.message.content ) ? event.message.content : [];
			for ( const block of blocks ) {
				if ( block.type === 'tool_result' ) {
					const content =
						typeof block.content === 'string'
							? block.content
							: JSON.stringify( block.content || '' );
					console.error( `   📦 tool result (${ content.length } chars)` );
				}
			}
			return null;
		}
		case 'result':
			return typeof event.result === 'string' ? event.result : null;
		default:
			return null;
	}
}

/**
 * Run the local `claude -p` CLI with the given prompt piped over stdin.
 *
 * Uses stream-json output so we can surface the agent's thinking and tool calls in
 * real time to stderr while still capturing the final consolidated text on stdout.
 *
 * @param {string} prompt - The full prompt text to send to Claude.
 * @return {Promise<string>} The trimmed text response printed by the CLI.
 */
export function runClaudeCli( prompt ) {
	return new Promise( ( resolve, reject ) => {
		// Run claude from os.tmpdir() so the subprocess doesn't pick up the project's
		// CLAUDE.md / .claude/ directory. Without this, project-installed skills can
		// trigger Claude to use the Write tool and dump output to a file in the repo
		// rather than print it to stdout — turning this pipeline into a no-op.
		const child = spawn(
			'claude',
			[
				'-p',
				'--model',
				CLAUDE_MODEL,
				'--effort',
				CLAUDE_EFFORT,
				'--output-format',
				'stream-json',
				'--verbose',
			],
			{ stdio: [ 'pipe', 'pipe', 'pipe' ], cwd: os.tmpdir() }
		);

		let stdoutBuffer = '';
		let stderr = '';
		const textChunks = [];
		let finalResult = null;

		child.stdout.on( 'data', chunk => {
			stdoutBuffer += chunk.toString();
			let newlineIndex;
			while ( ( newlineIndex = stdoutBuffer.indexOf( '\n' ) ) >= 0 ) {
				const line = stdoutBuffer.slice( 0, newlineIndex );
				stdoutBuffer = stdoutBuffer.slice( newlineIndex + 1 );
				if ( ! line.trim() ) {
					continue;
				}
				let event;
				try {
					event = JSON.parse( line );
				} catch {
					continue;
				}
				if (
					event.type === 'assistant' &&
					event.message &&
					Array.isArray( event.message.content )
				) {
					for ( const block of event.message.content ) {
						if ( block.type === 'text' && typeof block.text === 'string' ) {
							textChunks.push( block.text );
						}
					}
				}
				const resultText = handleStreamEvent( event );
				if ( resultText !== null ) {
					finalResult = resultText;
				}
			}
		} );
		child.stderr.on( 'data', chunk => ( stderr += chunk.toString() ) );

		child.on( 'error', err => {
			if ( err.code === 'ENOENT' ) {
				reject(
					new Error(
						'`claude` CLI not found. Install Claude Code: https://docs.claude.com/en/docs/claude-code'
					)
				);
				return;
			}
			reject( err );
		} );

		child.on( 'close', code => {
			if ( code !== 0 ) {
				reject(
					new Error( `claude exited with code ${ code }${ stderr ? `: ${ stderr.trim() }` : '' }` )
				);
				return;
			}
			const finalText = finalResult !== null ? finalResult : textChunks.join( '' );
			resolve( finalText.trim() );
		} );

		child.stdin.write( prompt );
		child.stdin.end();
	} );
}

/**
 * Print an interesting codex JSONL event to stderr so the user can see the agent working.
 * Returns the assistant's text when a final `agent_message` item arrives, otherwise null.
 *
 * @param {object} event - Parsed JSONL event from `codex exec --json`.
 * @return {string|null} The agent message text when seen, otherwise null.
 */
export function handleCodexStreamEvent( event ) {
	if ( ! event || typeof event !== 'object' ) {
		return null;
	}
	switch ( event.type ) {
		case 'item.completed': {
			const item = event.item || {};
			switch ( item.type ) {
				case 'agent_message':
					return typeof item.text === 'string' ? item.text : null;
				case 'reasoning': {
					const preview = oneLineSummary( item.text || item.summary || '', 140 );
					console.error( preview ? `   💭 ${ preview }` : '   💭 (reasoning)' );
					return null;
				}
				case 'command_execution': {
					const cmd = oneLineSummary( item.command || item.text || '', 100 );
					console.error( `   🔧 command(${ cmd })` );
					return null;
				}
				case 'file_change': {
					const filePath = item.path || item.file_path || '';
					console.error( `   ✏️  file_change(${ oneLineSummary( filePath, 100 ) })` );
					return null;
				}
				default:
					console.error( `   • ${ item.type }` );
					return null;
			}
		}
		case 'error':
		case 'turn.failed':
			console.error(
				`   ⚠️  ${ oneLineSummary( event.message || JSON.stringify( event ), 200 ) }`
			);
			return null;
		default:
			return null;
	}
}

/**
 * Run the local `codex exec` CLI with the given prompt piped over stdin.
 *
 * Uses --json output so we can surface the agent's reasoning and tool calls in
 * real time to stderr while still capturing the final agent message on stdout.
 *
 * @param {string} prompt - The full prompt text to send to Codex.
 * @return {Promise<string>} The trimmed text response printed by the CLI.
 */
export function runCodexCli( prompt ) {
	return new Promise( ( resolve, reject ) => {
		const child = spawn(
			'codex',
			[
				'exec',
				'--json',
				'--skip-git-repo-check',
				'--sandbox',
				'read-only',
				'-c',
				`model=${ CODEX_MODEL }`,
				'-c',
				`model_reasoning_effort=${ CODEX_EFFORT }`,
			],
			{ stdio: [ 'pipe', 'pipe', 'pipe' ], cwd: os.tmpdir() }
		);

		let stdoutBuffer = '';
		let stderr = '';
		const messageChunks = [];
		let finalResult = null;
		let failureMessage = null;

		child.stdout.on( 'data', chunk => {
			stdoutBuffer += chunk.toString();
			let newlineIndex;
			while ( ( newlineIndex = stdoutBuffer.indexOf( '\n' ) ) >= 0 ) {
				const line = stdoutBuffer.slice( 0, newlineIndex );
				stdoutBuffer = stdoutBuffer.slice( newlineIndex + 1 );
				if ( ! line.trim() ) {
					continue;
				}
				let event;
				try {
					event = JSON.parse( line );
				} catch {
					continue;
				}
				if ( event.type === 'error' || event.type === 'turn.failed' ) {
					failureMessage =
						typeof event.message === 'string'
							? event.message
							: JSON.stringify( event.error || event );
				}
				const messageText = handleCodexStreamEvent( event );
				if ( messageText !== null ) {
					messageChunks.push( messageText );
					finalResult = messageText;
				}
			}
		} );
		child.stderr.on( 'data', chunk => ( stderr += chunk.toString() ) );

		child.on( 'error', err => {
			if ( err.code === 'ENOENT' ) {
				reject(
					new Error( '`codex` CLI not found. Install Codex: https://github.com/openai/codex' )
				);
				return;
			}
			reject( err );
		} );

		child.on( 'close', code => {
			if ( failureMessage ) {
				reject( new Error( `codex turn failed: ${ failureMessage }` ) );
				return;
			}
			if ( code !== 0 ) {
				reject(
					new Error( `codex exited with code ${ code }${ stderr ? `: ${ stderr.trim() }` : '' }` )
				);
				return;
			}
			const finalText = finalResult !== null ? finalResult : messageChunks.join( '' );
			resolve( finalText.trim() );
		} );

		child.stdin.write( prompt );
		child.stdin.end();
	} );
}

/**
 * Pick the runner function that matches the configured AI provider.
 *
 * @param {string} ai - AI provider name ('claude' or 'codex').
 * @return {Function} The matching runner.
 */
export function getRunner( ai ) {
	return ai === 'codex' ? runCodexCli : runClaudeCli;
}
