export const trim = ( str: string, char: string ) => {
	return str.replace( new RegExp( '^[' + char + ']+|[' + char + ']+$', 'g' ), '' );
};
