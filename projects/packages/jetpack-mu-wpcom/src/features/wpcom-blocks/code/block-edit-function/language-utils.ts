import { LanguageData } from './codemirror-language-data.ts';
/**
 * Common utilities for working with the CodeMirror Language
 * and LanguageData libraries.
 */
import type { LanguageSupport } from '@codemirror/language';

/**
 * Returns a language if one is found matching the input alias.
 *
 * The provided alias does not need to match case with the language name.
 *
 * @param alias - A language name, e.g. "php" or "PHP" or "js" or "JavaScript" or "javascript".
 * @return Promise<[string, LanguageSupport]> Provided language alias with loaded LanguageSupport for it.
 */
export const getLanguage = ( alias: string ): Promise< [ string, LanguageSupport ] > => {
	const slug = alias.toLowerCase();

	const description = LanguageData.languages.find(
		( { name, alias: otherNames } ) =>
			name.toLowerCase() === slug ||
			otherNames.some( otherName => otherName.toLowerCase() === slug )
	);

	return description
		? description.load().then( extension => [ alias, extension ] )
		: Promise.reject();
};
