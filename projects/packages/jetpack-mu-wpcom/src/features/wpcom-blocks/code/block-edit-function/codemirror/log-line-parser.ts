import { LRLanguage, LanguageSupport } from '@codemirror/language';
import { tags as lezerTags, styleTags } from '@lezer/highlight';
import * as LogLanguage from './loglines.grammar';

export const logLanguage = new LanguageSupport(
	LRLanguage.define( {
		name: 'Log',
		parser: LogLanguage.parser.configure( {
			props: [
				styleTags( {
					'Date/...': lezerTags.bool,
					'Time/...': lezerTags.number,
					Debug: lezerTags.namespace,
					Info: lezerTags.namespace,
					Warning: lezerTags.annotation,
					Error: lezerTags.attributeValue,
					Critical: lezerTags.attributeValue,
					Message: lezerTags.comment,
				} ),
			],
		} ),
	} )
);
