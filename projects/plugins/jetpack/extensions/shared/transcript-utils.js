const toLineObj = function( group ) {
	return {
		line: group[ 1 ],
		startTime: group[ 2 ],
		endTime: group[ 3 ],
		text: group[ 4 ]
	};
};

export function SRT_parse( content ) {
	/* SRT format
	 * ----------------------------
	 * <index>
	 * <startTime> <endTime>
	 * <content>
	 * ----------------------------
	 * Providers: otter.ai
	 */
	const pattern = /(\d+)\n([\d:,]+)\s+-{2}>\s+([\d:,]+)\n([\s\S]*?(?=\n{2}|$))/gm;

	const result = [];
	let matches;

	content = content.replace( /\r\n|\r|\n/g, '\n' );

	while ( ( matches = pattern.exec( content ) ) !== null ) {
		result.push( toLineObj( matches ) );
	}

	return result;
}

export function TXT_parse ( content ) {
	content = content.replace( /\r\n|\r|\n/g, '\n' );

	const result = {
		dialogues: [],
		speakers: [],
	};

	let matches;

	/* Template:
	 * ----------------------------
	 * <speaker> <timestamp>
	 * <content>
	 * ----------------------------
	 * Providers: otter.ai
	 */
	const speakerTimestampRegExp = /(.*[^\s])\s+(\d{1,2}(:\d{1,2})+)\s+\n([\s\S]*?(?=\n{2}|$))/gm;

	while ( ( matches = speakerTimestampRegExp.exec( content ) ) != null ) {
		if ( result.speakers.indexOf( matches[ 1 ] ) < 0 ) {
			result.speakers.push( matches[ 1 ] );
		}

		result.dialogues.push( {
			speaker: matches[ 1 ],
			speakerSlug: `speaker-${ result.speakers.indexOf( matches[ 1 ] ) }`,
			timestamp: matches[ 2 ],
			content: matches[ 4 ],
		} );
	}

	result.speakers = result.speakers.map( ( speaker, ind ) => ( {
		label: speaker,
		slug: `speaker-${ ind }`,
	} ) );

	return result;
}
