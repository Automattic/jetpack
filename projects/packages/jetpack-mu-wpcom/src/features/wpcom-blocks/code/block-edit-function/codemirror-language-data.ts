import { LanguageDescription } from '@codemirror/language';
import * as LanguageData from '@codemirror/language-data';
import { logLanguage } from './codemirror/log-line-parser.ts';

LanguageData.languages.push(
	LanguageDescription.of( {
		name: logLanguage.language.name,
		extensions: [ 'log' ],
		load: async () => logLanguage,
	} )
);

import './codemirror/block-html-parser.ts';

export { LanguageData };
