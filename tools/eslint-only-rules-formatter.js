/**
 * Usage:
 *
 * eslint -f ./bin/eslint-only-rules-formatter [opts] [filenames]
 *
 * Outputs a sorted list of ruleIds with counts, like this:
 *
 * plugin/rule1: 10
 * plugin/rule5: 8
 * anotherplugin/anotherrule: 2
 */

module.exports = function( results ) {
	const rulesWithCounts = results
		.filter( result => result.messages.length > 0 )
		.reduce( ( ruleCounts, currValue ) => {
			currValue.messages.forEach( message => {
				const key = `${ message.ruleId }: ${ message.message }`;
				if ( ! ruleCounts[ key ] ) {
					ruleCounts[ key ] = 0;
				}

				ruleCounts[ key ] += 1;
			} );
			return ruleCounts;
		}, {} );
	var rulesArray = [];
	for ( var key in rulesWithCounts ) {
		rulesArray.push( [ key, rulesWithCounts[ key ] ] );
	}
	rulesArray.sort( function( a, b ) {
		return b[ 1 ] - a[ 1 ];
	} );
	return rulesArray
		.map( ruleWithCount => `${ ruleWithCount[ 0 ] }: ${ ruleWithCount[ 1 ] }` )
		.join( '\n' );
};
