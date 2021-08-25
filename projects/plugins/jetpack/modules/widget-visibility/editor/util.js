const htmlUnescapes = {
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&#39;': "'",
	'&nbsp;': '\u00A0',
};
const reEscapedHtml = /&(?:amp|lt|gt|quot|#39|nbsp);/g;

/*
 * Unescape html entities: unescape("Hello&gt;&gt;") = "Hello>>"
 * Scaled down version of unescape() from lodash.
 * (Yes, lodash's unescape() only does a few specific replacements!
 *  They recommend using "he" https://mths.be/he if you need full replacements.)
 * @param string str - input string
 * @returns string String with html entities unescaped
 */
export const unescape = str => {
	if ( typeof str !== 'string' ) {
		return str;
	}
	const replacer = input => htmlUnescapes[ input ];
	return str.replace( reEscapedHtml, replacer );
};
