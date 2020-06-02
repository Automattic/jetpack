export default function getFilterRequest( filters ) {
	const { mediaType, category, favorite, startDate, endDate } = filters;
	const query = [];

	if ( mediaType ) {
		query.push( 'mediaType=' + mediaType );
	}

	if ( category && mediaType !== 'video' ) {
		query.push( 'categoryInclude=' + category );
	}

	if ( favorite !== undefined ) {
		query.push( 'feature=favorite' );
	}

	if ( startDate || endDate ) {
		const start = startDate ? startDate.substr( 0, 10 ) : '0000-00-00';
		const end = endDate ? endDate.substr( 0, 10 ) : '0000-00-00';

		query.push( `dateRange=${ start }:${ end }` );
	}

	return query.length > 0 ? query : null;
}
