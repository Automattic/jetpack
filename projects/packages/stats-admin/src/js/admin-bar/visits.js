export const DAYS = 7;

/**
 * Read daily views and visitors from a stats visits response.
 *
 * @param {object} body - The response body, with `fields` naming the columns of each `data` row.
 * @return {{views: number[], visitors: number[]}} The last DAYS days, oldest first.
 * @throws {Error} When the response doesn't have the expected columns.
 */
export function parseVisits( body ) {
	const fields = Array.isArray( body?.fields ) ? body.fields : [];
	if ( ! Array.isArray( body?.data ) ) {
		throw new Error( 'Missing stats data.' );
	}

	const column = name => {
		const index = fields.indexOf( name );
		if ( index === -1 ) {
			throw new Error( `Missing stats column: ${ name }.` );
		}
		const values = body.data.map( row => Number( row?.[ index ] ) || 0 );
		// A site with less history can get fewer rows; treat the missing days as 0.
		return [ ...Array( DAYS ).fill( 0 ), ...values ].slice( -DAYS );
	};

	return { views: column( 'views' ), visitors: column( 'visitors' ) };
}
