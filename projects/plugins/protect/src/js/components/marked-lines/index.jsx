import styles from './styles.module.scss';

/**
 * Surrounds a text string in a <mark>
 * Just a small helper function
 *
 * @example
 * mark( 'be kind' ) =>
 *   <mark key="be kind" className={ styles[ 'marked-lines__mark' ] }>be kind</mark>
 * @param {string} text - the string to mark
 * @returns {import('react').Element} React <mark> Element
 */
const mark = text => (
	<mark key={ text } className={ styles[ 'marked-lines__mark' ] }>
		{ text }
	</mark>
);

/**
 * Translates marked-file context input
 * into React component output
 *
 * @example
 * const marks = [ [ 2, 4 ], [ 5, 9 ] ]
 * const content = '->^^-_____<--'
 * markup( marks, content ) === [ '->', <mark>{ '^^' }</mark>, '-', <mark>{ '_____' }</mark>, '<--' ]
 * @param {Array<Array<number>>} marks - spanning indices of text to mark, values in UCS-2 code units
 * @param {string} content - the plaintext content to mark
 * @returns {Array|string} list of output text nodes and mark elements or plain string output
 */
const markup = ( marks, content ) => {
	const [ finalOutput, finalLast ] = marks.reduce(
		( [ output, lastIndex ], [ markStart, markEnd ] ) => {
			// slice of input text specified by current mark ranges
			const slice = content.slice( markStart, markEnd );

			// if we have text before the first index then prepend it as well
			const next =
				markStart > lastIndex
					? [ content.slice( lastIndex, markStart ), mark( slice ) ]
					: [ mark( slice ) ];

			return [ [ ...output, ...next ], markEnd ];
		},
		[ [], 0 ]
	);

	// we may also have text after the last mark
	return finalLast < content.length ? [ ...finalOutput, content.slice( finalLast ) ] : finalOutput;
};

const MarkedLines = ( { context } ) => {
	const { marks, ...lines } = context;

	return (
		<div className={ styles[ 'marked-lines' ] }>
			<div className={ styles[ 'marked-lines__line-numbers' ] }>
				{ Object.keys( lines ).map( lineNumber => {
					const hasMarks = marks.hasOwnProperty( lineNumber );

					return (
						<div
							key={ lineNumber }
							className={ `${ styles[ 'marked-lines__line-number' ] } ${
								hasMarks ? styles[ 'marked-lines__marked-line' ] : ''
							}` }
						>
							{ lineNumber }
						</div>
					);
				} ) }
			</div>
			<div className={ styles[ 'marked-lines__lines' ] }>
				{ Object.keys( lines ).map( lineNumber => {
					const lineContent = lines[ lineNumber ] || ' ';
					const hasMarks = marks.hasOwnProperty( lineNumber );

					return (
						<div
							key={ lineNumber }
							className={ `${ styles[ 'marked-lines__line' ] } ${
								hasMarks ? styles[ 'marked-lines__marked-line' ] : ''
							} ` }
						>
							<>{ hasMarks ? markup( marks[ lineNumber ], lineContent ) : lineContent }</>
						</div>
					);
				} ) }
			</div>
		</div>
	);
};

export default MarkedLines;
