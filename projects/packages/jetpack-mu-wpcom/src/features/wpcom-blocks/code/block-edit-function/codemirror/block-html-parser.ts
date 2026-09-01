import * as HtmlLanguage from '@codemirror/lang-html';
import * as JsonLanguage from '@codemirror/lang-json';
import { type NestedParse, parseMixed } from '@lezer/common';
import { tags as lezerTags, styleTags } from '@lezer/highlight';
import * as BlockDelimiterLanguage from './blocks.grammar';

const blockDelimiterParser = BlockDelimiterLanguage.parser.configure( {
	props: [
		styleTags( {
			BlockDelimiter: lezerTags.angleBracket,
			BlockNamespace: lezerTags.namespace,
			BlockName: lezerTags.className,
			HtmlComment: lezerTags.blockComment,
		} ),
	],
	wrap: parseMixed( node => {
		return 'JsonAttributes' === node.type.name
			? { parser: JsonLanguage.jsonLanguage.parser }
			: null;
	} ),
} );

// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- This is intentional monkey-patching.
// @ts-ignore
HtmlLanguage.htmlLanguage.parser = HtmlLanguage.htmlLanguage.parser.configure( {
	wrap: parseMixed( ( node ): NestedParse | null => {
		if ( 'Comment' === node.type.name ) {
			return { parser: blockDelimiterParser };
		}

		return null;
	} ),
} );
