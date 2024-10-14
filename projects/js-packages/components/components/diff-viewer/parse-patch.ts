type Hunk = {
	oldStart: number;
	oldLines: number;
	newStart: number;
	newLines: number;
	lines: string[];
};

type Index = {
	index?: string;
	hunks?: Hunk[];
	oldFileName?: string;
	newFileName?: string;
	oldHeader?: string;
	newHeader?: string;
};

/**
 * Parse Patch
 *
 * Adapted from https://github.com/kpdecker/jsdiff/blob/master/src/patch/parse.js
 *
 * @param {string} uniDiff - diff string
 * @return {Array} - array of parsed files
 */
export default function parsePatch( uniDiff: string ) {
	const diffstr = uniDiff.split( /\n/ );
	const list = [];
	let i = 0;

	/**
	 * Parse Index
	 */
	function parseIndex() {
		const index: Index = {};

		list.push( index );

		// Parse diff metadata
		while ( i < diffstr.length ) {
			const line = diffstr[ i ];

			// File header found, end parsing diff metadata
			if ( /^(---|\+\+\+|@@)\s/.test( line ) ) {
				break;
			}

			// Diff index
			const header = /^(?:Index:|diff(?: -r \w+)+)\s+(.+?)\s*$/.exec( line );

			if ( header ) {
				index.index = header[ 1 ];
			}

			i++;
		}

		// Parse file headers if they are defined. Unified diff requires them, but
		// there's no technical issues to have an isolated hunk without file header
		parseFileHeader( index );
		parseFileHeader( index );

		// Parse hunks
		index.hunks = [];

		while ( i < diffstr.length ) {
			const _line = diffstr[ i ];

			if (
				/^(Index:\s|diff\s|---\s|\+\+\+\s|===================================================================)/.test(
					_line
				)
			) {
				break;
			} else if ( /^@@/.test( _line ) ) {
				index.hunks.push( parseHunk() );
			} else if ( _line ) {
				throw new Error( 'Unknown line ' + ( i + 1 ) + ' ' + JSON.stringify( _line ) );
			} else {
				i++;
			}
		}
	}

	/**
	 * Parse File Header
	 *
	 * Parses the --- and +++ headers, if none are found, no lines
	 * are consumed.
	 *
	 * @param {Array}    index       - array of parsed files
	 * @param {unknown}  index.index - index
	 * @param {object[]} index.hunks - hunks
	 */
	function parseFileHeader( index: Index ) {
		const fileHeader = /^(---|\+\+\+)\s+(.*)\r?$/.exec( diffstr[ i ] );

		if ( fileHeader ) {
			const keyPrefix = fileHeader[ 1 ] === '---' ? 'old' : 'new';

			const data = fileHeader[ 2 ].split( '\t', 2 );

			let fileName = data[ 0 ].replace( /\\\\/g, '\\' );

			if ( /^".*"$/.test( fileName ) ) {
				fileName = fileName.substr( 1, fileName.length - 2 );
			}

			index[ keyPrefix + 'FileName' ] = fileName;

			index[ keyPrefix + 'Header' ] = ( data[ 1 ] || '' ).trim();

			i++;
		}
	}

	/**
	 * Parse Hunk
	 * This assumes that we are at the start of a hunk.
	 *
	 * @return {object} - The parsed hunk.
	 */
	function parseHunk(): Hunk {
		const chunkHeaderIndex = i,
			chunkHeaderLine = diffstr[ i++ ],
			chunkHeader = chunkHeaderLine.split( /@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/ );

		const hunk = {
			oldStart: +chunkHeader[ 1 ],
			oldLines: typeof chunkHeader[ 2 ] === 'undefined' ? 1 : +chunkHeader[ 2 ],
			newStart: +chunkHeader[ 3 ],
			newLines: typeof chunkHeader[ 4 ] === 'undefined' ? 1 : +chunkHeader[ 4 ],
			lines: [],
		};

		// Unified Diff Format quirk: If the chunk size is 0,
		// the first number is one lower than one would expect.
		// https://www.artima.com/weblogs/viewpost.jsp?thread=164293

		if ( hunk.oldLines === 0 ) {
			hunk.oldStart += 1;
		}

		if ( hunk.newLines === 0 ) {
			hunk.newStart += 1;
		}

		let addCount = 0,
			removeCount = 0,
			_diffstr$i;
		for (
			;
			i < diffstr.length &&
			( removeCount < hunk.oldLines ||
				addCount < hunk.newLines ||
				( ( _diffstr$i = diffstr[ i ] ) !== null &&
					_diffstr$i !== void 0 &&
					_diffstr$i.startsWith( '\\' ) ) );
			i++
		) {
			const operation =
				diffstr[ i ].length === 0 && i !== diffstr.length - 1 ? ' ' : diffstr[ i ][ 0 ];

			if ( operation === '+' || operation === '-' || operation === ' ' || operation === '\\' ) {
				hunk.lines.push( diffstr[ i ] );

				if ( operation === '+' ) {
					addCount++;
				} else if ( operation === '-' ) {
					removeCount++;
				} else if ( operation === ' ' ) {
					addCount++;
					removeCount++;
				}
			} else {
				throw new Error(
					`Hunk at line ${ chunkHeaderIndex + 1 } contained invalid line ${ diffstr[ i ] }`
				);
			}
		}

		// Handle the empty block count case
		if ( ! addCount && hunk.newLines === 1 ) {
			hunk.newLines = 0;
		}

		if ( ! removeCount && hunk.oldLines === 1 ) {
			hunk.oldLines = 0;
		}

		// Perform sanity checking
		if ( addCount !== hunk.newLines ) {
			throw new Error(
				'Added line count did not match for hunk at line ' + ( chunkHeaderIndex + 1 )
			);
		}

		if ( removeCount !== hunk.oldLines ) {
			throw new Error(
				'Removed line count did not match for hunk at line ' + ( chunkHeaderIndex + 1 )
			);
		}

		return hunk;
	}

	while ( i < diffstr.length ) {
		parseIndex();
	}

	return list;
}
