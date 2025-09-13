/**
 * Internal dependencies
 */
import a8c from './a8c';
import brands from './brands';
import development from './development';
import abbreviations from './en/abbreviations';
import words from './en/words';
import extensions from './extensions';
import products from './products';
import software from './software';
import tlds from './tlds';
import web from './web';

const fullDictionary = [
	a8c,
	brands,
	development,
	extensions,
	products,
	software,
	tlds,
	web,
	abbreviations,
	words,
]
	.flatMap( block =>
		block
			.trim()
			.split( '\n' )
			.filter( line => line.trim() !== '' )
	)
	.join( '\n' );

export default fullDictionary;
