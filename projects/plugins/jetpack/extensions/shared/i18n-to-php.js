import React from 'react';

// How (and why) does this transform work?
// The idea here is to replace every call to each of `@wordpress/i18n`'s translation functions
// (`__()`, `_n()`, `_x()`, `_nx()`) with their PHP counterpart, wrapped in a `<?php ... ?>`
// pseudo-tag, and using `echo` to output the var, plus some escaping for sanitization.
// The most puzzling part might be the `echo`: after all, we can't know _how_ the translated
// strings are used in the Javascript source -- e.g. they might be assigned to a variable
// for later usage, rather than rendered directly.
// The answer is that this happens during React's rendering (to static markup, in this case),
// where the entire component logic is essentially flattened to a component string. This means
// that even translated strings that have gone through any intermediate steps will end up in
// that rendered markup -- and thus, we'll have our `<?php echo esc_html__( ... ) ?>`
// statements right where they belong.
// A note on implementation:
// Ideally, our replaced translation function would simply return `<?php echo esc_html__( ... ) ?>`.
// However, React sanitizes strings by escaping chars like `<`. As a consequence, we need to use
// `dangerouslySetInnerHTML` to bypass the escaping. This also requires to be attached as a prop
// to a DOM element. I've chosen `<span />` since this likely has the smallest footprint for
// rendering strings (e.g. shouldn't normally get in the way of styling).
export const __ = ( text, domain ) => (
	<span
		// eslint-disable-next-line react/no-danger
		dangerouslySetInnerHTML={ {
			__html: `<?php esc_html_e( '${ text }', '${ domain }' ) ?>`,
		} }
	/>
);

export const _n = ( single, plural, number, domain ) => (
	<span
		// eslint-disable-next-line react/no-danger
		dangerouslySetInnerHTML={ {
			__html: `<?php echo esc_html( _n( '${ single }', '${ plural }', ${ number }, '${ domain }' ) ) ?>`,
		} }
	/>
);

export const _x = ( text, context, domain ) => (
	<span
		// eslint-disable-next-line react/no-danger
		dangerouslySetInnerHTML={ {
			__html: `<?php echo esc_html( _x( '${ text }', '${ context }', '${ domain }' ) ) ?>`,
		} }
	/>
);

export const _nx = ( single, plural, number, context, domain ) => (
	<span
		// eslint-disable-next-line react/no-danger
		dangerouslySetInnerHTML={ {
			__html: `<?php echo esc_html( _nx( '${ single }', '${ plural }', ${ number }, '${ context }', '${ domain }' ) ) ?>`,
		} }
	/>
);

// We have to stub `sprintf` with the identity function here, since the original
// `sprintf from '@wordpress/i18n'` only accepts strings as its first argument -- but
// our replaced translation functions return a React element (`<span />`, see above).
// This means that our rendered markup will contain `sprintf`-style `%(placeholder)s`
// for which we need to add an extra `str_replace()` step. This is done in `components.php`.
// TODO: Provide a wrapper around `@wordpress/i18n`'s `sprintf` that accepts React elements
// as first argument, and remove the `str_replace()` call in `components.php`.
export const sprintf = x => x;

// We need to export `isRTL` from `@wordpress/i18n` as many consumers expect it
// to be available.
export { isRTL } from '@wordpress/i18n';
