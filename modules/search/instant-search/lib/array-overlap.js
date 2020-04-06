export default function arrayOverlap( a1, a2 ) {
	if ( ! Array.isArray( a1 ) ) {
		a1 = [ a1 ];
	}
	const intersection = a1.filter( value => a2.includes( value ) );
	return intersection.length !== 0;
}
