import { HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

export const SYNTAX_HIGHLIGHT_GRAY = '#757575';
export const SYNTAX_HIGHLIGHT_GRAY_LIGHT = '#B9B9B9';
export const SYNTAX_HIGHLIGHT_PURPLE = '#5200FF';
export const SYNTAX_HIGHLIGHT_BLUE = '#3858E9';
export const SYNTAX_HIGHLIGHT_ORANGE = '#D14900';
export const SYNTAX_HIGHLIGHT_GREEN = '#427700';

export const syntaxHighlightingStyle = HighlightStyle.define( [
	/*
	 * General
	 */
	{
		tag: t.comment,
		// A css class name is added in order to apply different focus styles to comments.
		// See `improved-code-editor-theme.css` for additional styling.
		class: 'tok-comment',
	},

	/*
	 * HTML
	 */
	{ tag: t.documentMeta, color: SYNTAX_HIGHLIGHT_GRAY },
	{ tag: t.tagName, color: SYNTAX_HIGHLIGHT_PURPLE },
	{ tag: t.attributeName, color: SYNTAX_HIGHLIGHT_BLUE },
	{ tag: t.attributeValue, color: SYNTAX_HIGHLIGHT_ORANGE },
	// HTML Character references like `&amp;`, `&lt;`, etc.
	{ tag: t.character, color: SYNTAX_HIGHLIGHT_GREEN },
	// Mismatched tags
	{ tag: t.invalid, backgroundColor: '#F00' },

	/*
	 * CSS
	 */
	// Keywords: `@media`, @keyframes`, etc.
	{ tag: t.definitionKeyword, color: SYNTAX_HIGHLIGHT_ORANGE },

	{
		tag: [
			// Tag name selectors like `div` or `custom-element`
			t.tagName,

			// Class selectors `.foo`
			t.className,

			// ID selectors `#foo` and keyframes identifier like `@keyframes foo`
			t.labelName,

			// Property names like `color`, `font-size`, etc.
			t.propertyName,

			// Numeric values (the number, not the unit) like in `10px`, `0` or `100%`
			t.number,
		],
		color: SYNTAX_HIGHLIGHT_PURPLE,
	},

	// Units like `px`, `%`, `em`, etc.
	{ tag: t.unit, color: SYNTAX_HIGHLIGHT_GREEN },

	// String values like in `content: "Hello, world!"` or [attr="value"]
	{ tag: t.string, color: SYNTAX_HIGHLIGHT_BLUE },

	// Function names like `calc()`, `var()`, etc.
	{ tag: t.operatorKeyword, color: SYNTAX_HIGHLIGHT_ORANGE },

	// `*`, `&` selectors
	{ tag: t.definitionOperator, color: SYNTAX_HIGHLIGHT_PURPLE },

	// `!important`
	{ tag: t.modifier, fontWeight: 'bold' },
] );
