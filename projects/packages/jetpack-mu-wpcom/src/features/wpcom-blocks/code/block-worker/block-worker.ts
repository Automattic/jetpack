type InboundMessage = { ref: string } & {
	method: 'guessLanguage';
	code: string;
};

type OutboundMessage = { ref: string } & {
	result: string | null;
};

const { port1: parentPort, port2: theirPort } = new MessageChannel();

self.postMessage( 'init', [ theirPort ] );
parentPort.onmessage = ( msg: MessageEvent< InboundMessage > ) => {
	switch ( msg.data?.method ) {
		case 'guessLanguage':
			return respond( msg.data, guessLanguage( msg.data.code ) );
	}
};

const respond = < T extends OutboundMessage >( data: InboundMessage, response: T[ 'result' ] ) => {
	parentPort.postMessage( { ref: data.ref, result: response } );
};

/**
 * Attempts to infer the language inside the code block.
 *
 * @param code -- Code content string.
 * @return Language name or `null` if no match found.
 */
const guessLanguage = ( code: string ): string | null => {
	if ( ! code ) {
		return null;
	}

	// PHP detection
	if ( code.includes( '<?php' ) ) {
		return 'PHP';
	}

	if ( code.startsWith( '<?xml version' ) ) {
		return 'XML';
	}

	if ( /^(?:#include <(?:stdio|stdlib)\.h>$|(void|int) main\()/m.test( code.slice( 0, 1024 ) ) ) {
		return 'C';
	}

	if ( /^.[a-z]+ {$/.test( code ) ) {
		return 'CSS';
	}

	if ( /\bC:\\/.test( code ) ) {
		return 'PowerShell';
	}

	if ( /<!--\s+wp:|<[a-zA-Z]\S*\s|&amp;/.test( code ) ) {
		return 'HTML';
	}

	if ( '{' === code.slice( 0, 1 ) && '}' === code.slice( -1 ) ) {
		return 'JSON';
	}

	if ( /console\.log\(|^export default|^export const|\.js|addEventListener/.test( code ) ) {
		return 'TypeScript';
	}

	// Python detection
	if ( /^import (?:numpy|threading|torch)$| dict\(\)|^\s*def [a-zA-Z_]+\(.*?\):$/.test( code ) ) {
		return 'Python';
	}

	if ( /^package main$|if err := /.test( code ) ) {
		return 'Go';
	}

	if (
		/^\d{4}[-/]\d{2}[-/]\d{2} \d{2}:\d{2}:\d{2} (?:DEBUG|INFO|WARNING|ERROR|CRITICAL) /.test( code )
	) {
		return 'Log';
	}

	if ( /SELECT|INNER JOIN|WHERE/.test( code ) ) {
		return 'SQL';
	}

	if ( /^=[A-Z]+\(/.test( code ) ) {
		return 'Spreadsheet';
	}

	if ( /!\[[^]]+]\([^)]+\)/.test( code ) ) {
		return 'Markdown';
	}

	if ( /\b[A-Z][a-z]+(?:[A-Z][a-z]+)*\[.*?]/.test( code ) ) {
		return 'Mathematica';
	}

	return null;
};
