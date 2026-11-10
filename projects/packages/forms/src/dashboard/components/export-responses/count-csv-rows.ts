const QUOTE = 0x22;
const NEWLINE = 0x0a;

export type CsvRowCount = {
	/** Line breaks seen outside quoted values, header included. */
	rows: number;
	/** Whether the last chunk ended inside a quoted value. */
	inQuotes: boolean;
};

/**
 * Counts the CSV rows completed by one chunk of a streamed file, continuing from the previous chunk's count.
 *
 * Works on raw bytes: in UTF-8, quote and newline bytes never occur inside a multi-byte character.
 *
 * @param {Uint8Array}  chunk    - The next bytes of the file.
 * @param {CsvRowCount} previous - The count after the previous chunk.
 * @return {CsvRowCount} The count after this chunk.
 */
export default function countCsvRows( chunk: Uint8Array, previous: CsvRowCount ): CsvRowCount {
	let { rows, inQuotes } = previous;
	for ( let i = 0; i < chunk.length; i++ ) {
		// An escaped quote ("") toggles twice, which leaves the state unchanged.
		if ( chunk[ i ] === QUOTE ) {
			inQuotes = ! inQuotes;
		} else if ( chunk[ i ] === NEWLINE && ! inQuotes ) {
			rows++;
		}
	}
	return { rows, inQuotes };
}
