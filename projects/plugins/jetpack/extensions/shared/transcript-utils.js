
/**
 * Internal dependencies
 */
import { pickExtensionFromFileName } from './file-utils';

export const FILE_EXTENSION_SRT = '.srt';
export const FILE_EXTENSION_TXT = '.txt';
export const FILE_EXTENSION_VTT = '.vtt';
export const FILE_EXTENSION_SBV = '.sbv';

const ACCEPTED_FILE_EXT_ARRAY = [
	FILE_EXTENSION_SRT,
	FILE_EXTENSION_TXT,
	FILE_EXTENSION_VTT,
	FILE_EXTENSION_SBV,
];

/*
 * Template:
 * ----------------------------
 * <speaker> <timestamp>
 *  <content>
 * ----------------------------
 * Providers: otter.ai
 */
export const speakerTimestampRegExp = /(.*[^\s])\s+(\d{1,2}(:\d{1,2})+)\s*\n([\s\S]*?(?=\n{2}|$))/gm;

/* SRT format
 * ----------------------------
 * <index>
 * <startTime> <endTime>
 * <content>
 * ----------------------------
 * Providers: otter.ai / youtube.com / etc
 */
export const srtRegExp = /(\d+)\n([\d:,]+)\s+-{2}>\s+([\d:,]+)\n([\s\S]*?(?=\n{2}|$))/gm;

export function isValidTranscriptFormat( content ) {
	return speakerTimestampRegExp.test( content );
}

export function isAcceptedTranscriptExtension( fileExtension ) {
	return ACCEPTED_FILE_EXT_ARRAY.indexOf( fileExtension ) >= 0;
}

const toLineObj = function( group ) {
	return {
		line: group[ 1 ],
		startTime: group[ 2 ],
		endTime: group[ 3 ],
		text: group[ 4 ]
	};
};

export function SRT_parse( content ) {
	const result = [];
	let matches;

	content = content.replace( /\r\n|\r|\n/g, '\n' );

	while ( ( matches = srtRegExp.exec( content ) ) !== null ) {
		result.push( toLineObj( matches ) );
	}

	return result;
}

export function TXT_parse ( content ) {
	content = content.replace( /\r\n|\r|\n/g, '\n' );

	const result = {
		dialogues: [],
		conversation: {
			speakers: [],
		}
	};

	let matches;

	while ( ( matches = speakerTimestampRegExp.exec( content ) ) != null ) {
		if ( result.conversation.speakers.indexOf( matches[ 1 ] ) < 0 ) {
			result.conversation.speakers.push( matches[ 1 ] );
		}

		result.dialogues.push( {
			label: matches[ 1 ],
			slug: `speaker-${ result.conversation.speakers.indexOf( matches[ 1 ] ) }`,
			content: matches[ 4 ],
			timestamp: matches[ 2 ],
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
	// Read file content.
	const reader = new FileReader();
	reader.addEventListener( 'load', ( ev ) => {
		const rawData = ev.target.result;
		if ( ! rawData?.length ) {
			return;
		}

		// Detect format by extension.
		const fileExtension = pickExtensionFromFileName( file?.name );

		if (
			fileExtension &&
			fileExtension !== FILE_EXTENSION_TXT &&
			isAcceptedTranscriptExtension( fileExtension )
		) {
			if ( fileExtension === FILE_EXTENSION_SRT ) {
				return fn( SRT_parse( rawData ) );
			}
		}

		if ( fileExtension === FILE_EXTENSION_TXT ) {
			return fn( TXT_parse( rawData ) );
		}
	} );

	reader.readAsText( file );
}

// export async function loadTranscriptFile( files ) {
// 	return await new Promise( ( resolve ) => {
// 		if ( ! files?.length ) {
// 			return resolve();
// 		}

// 		const file = files[ 0 ];

// 		// Read file content.
// 		const reader = new FileReader();
// 		reader.addEventListener( 'load', ( ev ) => {
// 			const rawData = ev.target.result;
// 			if ( ! rawData?.length ) {
// 				return resolve();
// 			}

// 			// Detect format by extension.
// 			const fileExtension = pickExtensionFromFileName( file?.name );

// 			if (
// 				fileExtension &&
// 				fileExtension !== FILE_EXTENSION_TXT &&
// 				isAcceptedTranscriptExtension( fileExtension )
// 			) {
// 				if ( fileExtension === FILE_EXTENSION_SRT ) {
// 					return resolve( SRT_parse( rawData ) );
// 				}
// 			}

// 			if ( fileExtension === FILE_EXTENSION_TXT ) {
// 				return resolve( false );
// 			}
// 		} );

// 		reader.readAsText( file );
// 	} );
// }

