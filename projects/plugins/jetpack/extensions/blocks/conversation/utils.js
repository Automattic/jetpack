
/**
 * WordPress dependencies
 */
import { create, getTextContent } from '@wordpress/rich-text';
import { escapeHTML } from '@wordpress/escape-html';
import { __ } from '@wordpress/i18n';

export function getParticipantBySlug( participants, participantSlug ) {
	const part = participants.filter( ( { slug } ) => ( slug === participantSlug ) );
	return part?.length ? part[ 0 ] : null;
}

export function getParticipantByLabel ( participants, participantLabel ) {
	const part = participants.filter( ( { label } ) => ( label?.toLowerCase() === participantLabel?.toLowerCase() ) );
	return part?.length ? part[ 0 ] : null;
}

export function getPlainText( html, escape = false ) {
	const text = getTextContent( create( { html } ) )?.trim();
	if ( ! escape ) {
		return text;
	}

	return escapeHTML( text );
}

/**
 * Return the file extension according to the file name.
 *
 * @param {string} filename - file full name.
 * @returns {string} File extension.
 */
export function pickExtensionFromFileName( filename ) {
	return `.${ filename.substr( filename.lastIndexOf( '.' ) + 1 ) }`;
}

export const FILE_EXTENSION_SRT = '.srt';
export const FILE_EXTENSION_TXT = '.txt';
export const FILE_EXTENSION_VTT = '.vtt';
export const FILE_EXTENSION_SBV = '.sbv';

export const ACCEPTED_FILE_EXT_ARRAY = [
	FILE_EXTENSION_SRT,
	FILE_EXTENSION_TXT,
	FILE_EXTENSION_VTT,
	FILE_EXTENSION_SBV,
];

export const ACCEPTED_FILE_EXTENSIONS = ACCEPTED_FILE_EXT_ARRAY.join( ', ' );

export const TRANSCRIPT_MAX_FILE_SIZE = 100000;

/*
 * Generic format / template.
 * ----------------------------
 * <speaker> <timestamp>
 *  <content>
 * ----------------------------
 * Serices: otter.ai, ...
 */
const otterFormatRegExp = /(.*[^\s])\s{1,}(\d{1,2}(?::\d{1,2}?)+)\s+\n([\s\S]*?(?=\n{2}|$))/gm;
const otterFormatTestRegExp = /(.*[^\s])\s{1,}(\d{1,2}(?::\d{1,2}?)+)\s+\n([\s\S]*?(?=\n{2}|$))/g;

/*
 * ----------------------------
 * <speaker>: [<timestamp>] <content>
 * ----------------------------
 * Serices: sonix.ai, ...
 */
const sonixFormatRegExp = /(?:(.*[^\s]):\s*)?\[([\d{1,2}:]*)]\s([\s\S]*?(?=\n{1,2}|$))/gm;
const sonixFormatTestRegExp = /(.*[^\s]):\s*\[([\d{1,2}:]*)]\s([\s\S]*?(?=\n{1,2}|$))/g;

const parsers = [
	{
		name: 'otter',
		re: otterFormatRegExp,
		testRE: otterFormatTestRegExp,
	},
	{
		name: 'sonix',
		re: sonixFormatRegExp,
		testRE: sonixFormatTestRegExp,
	},
];

/* SRT format / template.
 * ----------------------------
 * <index>
 * <startTime> --> <endTime>
 * <content>
 * ----------------------------
 * Serices: otter.ai, youtube.com, etc.
 */
export const srtFormatRegExp = /(\d+)\n([\d:,]+)\s+-{2}>\s+([\d:,]+)\n([\s\S]*?(?=\n{2}|$))/gm;

export function isAcceptedTranscriptExtension( fileExtension ) {
	return ACCEPTED_FILE_EXT_ARRAY.indexOf( fileExtension ) >= 0;
}

export function SRT_parse( content ) {
	const result = {
		conversation: {
			speakers: [],
		},
		dialogues: [],
	};

	let matches;

	while ( ( matches = srtFormatRegExp.exec( content ) ) !== null ) {
		result.dialogues.push( {
			timestamp: matches[ 2 ],
			content: matches[ 4 ]
		} );
	}

	return result;
}

export function TXT_parse ( content ) {
	const result = {
		dialogues: [],
		conversation: {
			speakers: [],
		}
	};

	// Pick vallid parsers testing the content.
	const validParsers = parsers.filter( ( { testRE } ) => testRE.test( content ) );
	if ( ! validParsers?.length ) {
		return result;
	}

	// Pick the first parser from the list.
	const parser = validParsers[ 0 ];

	let matches;
	while ( ( matches = parser.re.exec( content ) ) != null ) {
		const speakerName = matches[ parser?.indexes?.speaker || 1 ] || '';

		if (
			speakerName?.length &&
			result.conversation.speakers.indexOf( speakerName ) < 0
		) {
			result.conversation.speakers.push( speakerName );
		}

		result.dialogues.push( {
			label: speakerName,
			slug: `speaker-${ result.conversation.speakers.indexOf( speakerName ) }`,
			content: matches[ parser?.indexes?.content || 3 ],
			timestamp: matches[ parser?.indexes?.timestamp || 2 ],
			showTimestamp: true,
		} );
	}

	result.conversation.speakers = result.conversation.speakers.map( ( speaker, ind ) => ( {
		label: speaker,
		slug: `speaker-${ ind }`,
	} ) );

	return result;
}

export function parseTranscriptFile( file, fn ) {
	// Detect format by extension.
	const fileExtension = pickExtensionFromFileName( file?.name );

	const reader = new FileReader();
	reader.addEventListener( 'load', ( ev ) => {
		const rawData = ev.target.result
			? ev.target.result.replace( /\r\n|\r|\n/g, '\n' )
			: null;

		if ( ! rawData?.length ) {
			return;
		}

		if ( fileExtension && fileExtension !== FILE_EXTENSION_TXT ) {
			if ( fileExtension === FILE_EXTENSION_SRT ) {
				return fn( SRT_parse( rawData ) );
			}
		}

		if ( fileExtension === FILE_EXTENSION_TXT ) {
			return fn( TXT_parse( rawData ) );
		}

		fn( {}, __( 'Transcript format not supported', 'jetpack' ) );
	} );

	reader.readAsText( file );
}