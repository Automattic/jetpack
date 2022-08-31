export const variableReplacement = (
	template: string | null | undefined,
	variables: string[]
): string => {
	const regex = new RegExp( `\\$\\d`, 'g' );

	if ( template === null || template === undefined ) {
		return '';
	}

	return template.replace( regex, ( match: string ) => {
		const index = parseInt( match.substr( 1 ), 10 );
		const variable = variables[ index - 1 ];

		return variable || '';
	} );
};
