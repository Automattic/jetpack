import { WorkerLinter } from 'harper.js';

const worker = new WorkerLinter();
//let linter = new LocalLinter();

// we can probably get rid of this and instead move it to breve/features/grammar
/**
 * This is a very small Harper library
 * @param text - The text to check the grammar of.
 * @return array A list of suggestions.
 */
export async function CheckGrammar( text: string ) {
	const lints = await worker.lint( text );

	const items = [];

	//console.log( 'called CheckGrammar:', lints );

	for ( const lint of lints ) {
		items.push( {
			text,
			message: lint.message(),
			startIndex: lint.span().start,
			endIndex: lint.span().end,
			suggestions: lint.suggestions(),
			numSuggestions: lint.suggestion_count(),
		} );
	}

	localStorage.setItem( 'grammar-poc-test', JSON.stringify( items ) );
}
