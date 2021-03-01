const toLineObj = function( group ) {
	return {
		line: group[ 1 ],
		startTime: group[ 2 ],
		endTime: group[ 3 ],
		text: group[ 4 ]
	};
};

export function SRT_parse( content ) {
	// SRT format.
	const pattern = /(\d+)\n([\d:,]+)\s+-{2}>\s+([\d:,]+)\n([\s\S]*?(?=\n{2}|$))/gm;

	const result = [];
	let matches;

	content = content.replace( /\r\n|\r|\n/g, '\n' );

	while ( ( matches = pattern.exec( content ) ) != null ) {
		result.push( toLineObj( matches ) );
	}

	return result;
}