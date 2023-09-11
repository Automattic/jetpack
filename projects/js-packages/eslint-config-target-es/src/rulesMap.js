// Map of eslint-plugin-es-x rules to MDN compat-data paths.
// Values are either a path, an array of paths, true to always enable the rule, or false to always disable it.
module.exports = {
	// ?
	'no-atomics-waitasync': 'javascript.builtins.Atomics.waitAsync',
	'no-regexp-v-flag': 'javascript.builtins.RegExp.unicodeSets',
	'no-string-prototype-iswellformed-towellformed': [
		'javascript.builtins.String.isWellFormed',
		'javascript.builtins.String.toWellFormed',
	],

	// ES2023
	'no-array-prototype-findlast-findlastindex': [
		'javascript.builtins.Array.findLast',
		'javascript.builtins.Array.findLastIndex',
	],
	'no-array-prototype-toreversed': 'javascript.builtins.Array.toReversed',
	'no-array-prototype-tosorted': 'javascript.builtins.Array.toSorted',
	'no-array-prototype-tospliced': 'javascript.builtins.Array.toSpliced',
	'no-array-prototype-with': 'javascript.builtins.Array.with',
	'no-hashbang': 'javascript.grammar.hashbang_comments',
	'no-intl-numberformat-prototype-formatrange': 'javascript.builtins.Intl.NumberFormat.formatRange',
	'no-intl-numberformat-prototype-formatrangetoparts':
		'javascript.builtins.Intl.NumberFormat.formatRangeToParts',
	'no-intl-pluralrules-prototype-selectrange': 'javascript.builtins.Intl.PluralRules.selectRange',
	'no-regexp-unicode-property-escapes-2023': false, // No support data in MDN separate from no-regexp-unicode-property-escapes. https://github.com/mdn/browser-compat-data/issues/19631

	// ES2022
	'no-arbitrary-module-namespace-names': false, // No support data. https://github.com/mdn/browser-compat-data/issues/18152
	'no-array-string-prototype-at': [
		'javascript.builtins.Array.at',
		'javascript.builtins.String.at',
		'javascript.builtins.TypedArray.at',
	],
	'no-class-fields': [
		'javascript.classes.private_class_fields',
		'javascript.classes.private_class_methods',
		'javascript.classes.public_class_fields',
		'javascript.classes.static_class_fields',
	],
	'no-class-static-block': 'javascript.classes.static_initialization_blocks',
	'no-error-cause': [
		'javascript.builtins.Error.Error.options_cause_parameter',
		'javascript.builtins.Error.cause',
	],
	'no-intl-segmenter': 'javascript.builtins.Intl.Segmenter',
	'no-intl-supportedvaluesof': 'javascript.builtins.Intl.supportedValuesOf',
	'no-object-hasown': 'javascript.builtins.Object.hasOwn',
	'no-private-in': 'javascript.classes.private_class_fields_in',
	'no-regexp-d-flag': 'javascript.builtins.RegExp.hasIndices',
	'no-regexp-unicode-property-escapes-2022': false, // No support data in MDN separate from no-regexp-unicode-property-escapes. https://github.com/mdn/browser-compat-data/issues/19631
	'no-top-level-await': 'javascript.operators.await.top_level',

	// ES2021
	'no-intl-datetimeformat-prototype-formatrange':
		'javascript.builtins.Intl.DateTimeFormat.formatRange',
	'no-intl-displaynames': 'javascript.builtins.Intl.DisplayNames',
	'no-intl-listformat': 'javascript.builtins.Intl.ListFormat',
	'no-logical-assignment-operators': [
		'javascript.operators.logical_and_assignment',
		'javascript.operators.nullish_coalescing_assignment',
		'javascript.operators.logical_or_assignment',
	],
	'no-numeric-separators': 'javascript.grammar.numeric_separators',
	'no-promise-any': [ 'javascript.builtins.AggregateError', 'javascript.builtins.Promise.any' ],
	'no-regexp-unicode-property-escapes-2021': false, // No support data in MDN separate from no-regexp-unicode-property-escapes. https://github.com/mdn/browser-compat-data/issues/19631
	'no-string-prototype-replaceall': 'javascript.builtins.String.replaceAll',
	'no-weakrefs': [ 'javascript.builtins.WeakRef', 'javascript.builtins.FinalizationRegistry' ],

	// ES2020
	'no-bigint': [
		'javascript.builtins.BigInt',
		'javascript.builtins.BigInt64Array',
		'javascript.builtins.BigUint64Array',
	],
	'no-dynamic-import': 'javascript.operators.import',
	'no-export-ns-from': 'javascript.statements.export.namespace',
	'no-global-this': 'javascript.builtins.globalThis',
	'no-import-meta': 'javascript.operators.import_meta',
	'no-intl-locale': 'javascript.builtins.Intl.Locale',
	'no-intl-relativetimeformat': 'javascript.builtins.Intl.RelativeTimeFormat',
	'no-nullish-coalescing-operators': 'javascript.operators.nullish_coalescing',
	'no-optional-chaining': 'javascript.operators.optional_chaining',
	'no-promise-all-settled': 'javascript.builtins.Promise.allSettled',
	'no-regexp-unicode-property-escapes-2020': false, // No support data in MDN separate from no-regexp-unicode-property-escapes. https://github.com/mdn/browser-compat-data/issues/19631
	'no-string-prototype-matchall': 'javascript.builtins.String.matchAll',

	// ES2019
	'no-array-prototype-flat': [
		'javascript.builtins.Array.flat',
		'javascript.builtins.Array.flatMap',
	],
	'no-json-superset': 'javascript.builtins.JSON.json_superset',
	'no-object-fromentries': 'javascript.builtins.Object.fromEntries',
	'no-optional-catch-binding': 'javascript.statements.try_catch.optional_catch_binding',
	'no-regexp-unicode-property-escapes-2019': false, // No support data in MDN separate from no-regexp-unicode-property-escapes. https://github.com/mdn/browser-compat-data/issues/19631
	'no-string-prototype-trimstart-trimend': [
		'javascript.builtins.String.trimEnd',
		'javascript.builtins.String.trimStart',
	],
	'no-symbol-prototype-description': 'javascript.builtins.Symbol.description',

	// ES2018
	'no-async-iteration': [
		'javascript.operators.async_generator_function',
		'javascript.statements.async_generator_function',
	],
	'no-intl-numberformat-prototype-formattoparts':
		'javascript.builtins.Intl.NumberFormat.formatToParts',
	'no-intl-pluralrules': 'javascript.builtins.Intl.PluralRules',
	'no-malformed-template-literals':
		'javascript.grammar.template_literals.template_literal_revision',
	'no-promise-prototype-finally': 'javascript.builtins.Promise.finally',
	'no-regexp-lookbehind-assertions': 'javascript.regular_expressions.lookahead_assertion',
	'no-regexp-named-capture-groups': 'javascript.regular_expressions.named_capturing_group',
	'no-regexp-s-flag': 'javascript.builtins.RegExp.dotAll',
	'no-regexp-unicode-property-escapes':
		'javascript.regular_expressions.unicode_character_class_escape',
	'no-rest-spread-properties': [
		'javascript.operators.object_initializer.spread_properties',
		'javascript.operators.spread.spread_in_object_literals',
	],

	// ES2017
	'no-async-functions': [
		'javascript.operators.async_function',
		'javascript.statements.async_function',
	],
	'no-atomics': 'javascript.builtins.Atomics',
	'no-intl-datetimeformat-prototype-formattoparts':
		'javascript.builtins.Intl.DateTimeFormat.formatRangeToParts',
	'no-object-entries': 'javascript.builtins.Object.entries',
	'no-object-getownpropertydescriptors': 'javascript.builtins.Object.getOwnPropertyDescriptors',
	'no-object-values': 'javascript.builtins.Object.values',
	'no-shared-array-buffer': 'javascript.builtins.SharedArrayBuffer',
	'no-string-prototype-padstart-padend': [
		'javascript.builtins.String.padEnd',
		'javascript.builtins.String.padStart',
	],
	'no-trailing-function-commas': [
		'javascript.grammar.trailing_commas.trailing_commas_in_functions',
		'javascript.functions.arrow_functions.trailing_comma',
		'javascript.operators.function.trailing_comma',
		'javascript.operators.generator_function.trailing_comma',
		'javascript.statements.function.trailing_comma_in_parameters',
		'javascript.statements.generator_function.trailing_comma_in_parameters',
	],

	// ES2016
	'no-array-prototype-includes': 'javascript.builtins.Array.includes',
	'no-exponential-operators': 'javascript.operators.exponentiation',
	'no-intl-getcanonicallocales': 'javascript.builtins.Intl.getCanonicalLocales',

	// ES2015
	'no-array-from': 'javascript.builtins.Array.from',
	'no-array-of': 'javascript.builtins.Array.of',
	'no-array-prototype-copywithin': 'javascript.builtins.Array.copyWithin',
	'no-array-prototype-entries': 'javascript.builtins.Array.entries',
	'no-array-prototype-fill': 'javascript.builtins.Array.fill',
	'no-array-prototype-find': 'javascript.builtins.Array.find',
	'no-array-prototype-findindex': 'javascript.builtins.Array.findIndex',
	'no-array-prototype-keys': 'javascript.builtins.Array.keys',
	'no-array-prototype-values': 'javascript.builtins.Array.values',
	'no-arrow-functions': 'javascript.functions.arrow_functions',
	'no-binary-numeric-literals': 'javascript.grammar.binary_numeric_literals',
	'no-block-scoped-functions': 'javascript.functions.block_level_functions',
	'no-block-scoped-variables': [ 'javascript.statements.const', 'javascript.statements.let' ],
	'no-classes': 'javascript.classes',
	'no-computed-properties': [
		'javascript.operators.object_initializer.computed_property_names',
		'javascript.operators.destructuring.computed_property_names',
		'javascript.functions.get.computed_property_names',
		'javascript.functions.set.computed_property_names',
	],
	'no-default-parameters': 'javascript.functions.default_parameters',
	'no-destructuring': 'javascript.operators.destructuring',
	'no-for-of-loops': 'javascript.statements.for_of',
	'no-generators': [
		'javascript.operators.generator_function',
		'javascript.statements.generator_function',
	],
	'no-map': 'javascript.builtins.Map',
	'no-math-acosh': 'javascript.builtins.Math.acosh',
	'no-math-asinh': 'javascript.builtins.Math.asinh',
	'no-math-atanh': 'javascript.builtins.Math.atanh',
	'no-math-cbrt': 'javascript.builtins.Math.cbrt',
	'no-math-clz32': 'javascript.builtins.Math.clz32',
	'no-math-cosh': 'javascript.builtins.Math.cosh',
	'no-math-expm1': 'javascript.builtins.Math.expm1',
	'no-math-fround': 'javascript.builtins.Math.fround',
	'no-math-hypot': 'javascript.builtins.Math.hypot',
	'no-math-imul': 'javascript.builtins.Math.imul',
	'no-math-log10': 'javascript.builtins.Math.log10',
	'no-math-log1p': 'javascript.builtins.Math.log1p',
	'no-math-log2': 'javascript.builtins.Math.log2',
	'no-math-sign': 'javascript.builtins.Math.sign',
	'no-math-sinh': 'javascript.builtins.Math.sinh',
	'no-math-tanh': 'javascript.builtins.Math.tanh',
	'no-math-trunc': 'javascript.builtins.Math.trunc',
	'no-modules': [ 'javascript.statements.import', 'javascript.statements.export' ],
	'no-new-target': 'javascript.operators.new_target',
	'no-number-epsilon': 'javascript.builtins.Number.EPSILON',
	'no-number-isfinite': 'javascript.builtins.Number.isFinite',
	'no-number-isinteger': 'javascript.builtins.Number.isInteger',
	'no-number-isnan': 'javascript.builtins.Number.isNaN',
	'no-number-issafeinteger': 'javascript.builtins.Number.isSafeInteger',
	'no-number-maxsafeinteger': 'javascript.builtins.Number.MAX_SAFE_INTEGER',
	'no-number-minsafeinteger': 'javascript.builtins.Number.MIN_SAFE_INTEGER',
	'no-number-parsefloat': 'javascript.builtins.Number.parseFloat',
	'no-number-parseint': 'javascript.builtins.Number.parseInt',
	'no-object-assign': 'javascript.builtins.Object.assign',
	'no-object-getownpropertysymbols': 'javascript.builtins.Object.getOwnPropertySymbols',
	'no-object-is': 'javascript.builtins.Object.is',
	'no-object-setprototypeof': 'javascript.builtins.Object.setPrototypeOf',
	'no-object-super-properties': 'javascript.operators.super',
	'no-octal-numeric-literals': 'javascript.grammar.octal_numeric_literals',
	'no-promise': 'javascript.builtins.Promise',
	'no-property-shorthands': [
		'javascript.grammar.shorthand_object_literals',
		'javascript.operators.object_initializer.shorthand_method_names',
		'javascript.operators.object_initializer.shorthand_property_names',
	],
	'no-proxy': 'javascript.builtins.Proxy',
	'no-reflect': 'javascript.builtins.Reflect',
	'no-regexp-prototype-flags': 'javascript.builtins.RegExp.flags',
	'no-regexp-u-flag': 'javascript.builtins.RegExp.unicode',
	'no-regexp-y-flag': 'javascript.builtins.RegExp.sticky',
	'no-rest-parameters': 'javascript.functions.rest_parameters',
	'no-set': 'javascript.builtins.Set',
	'no-spread-elements': [
		'javascript.operators.spread.spread_in_arrays',
		'javascript.operators.spread.spread_in_function_calls',
	],
	'no-string-fromcodepoint': 'javascript.builtins.String.fromCodePoint',
	'no-string-prototype-codepointat': 'javascript.builtins.String.codePointAt',
	'no-string-prototype-endswith': 'javascript.builtins.String.endsWith',
	'no-string-prototype-includes': 'javascript.builtins.String.includes',
	'no-string-prototype-normalize': 'javascript.builtins.String.normalize',
	'no-string-prototype-repeat': 'javascript.builtins.String.repeat',
	'no-string-prototype-startswith': 'javascript.builtins.String.startsWith',
	'no-string-raw': 'javascript.builtins.String.raw',
	'no-subclassing-builtins': false, // No support data.
	'no-symbol': 'javascript.builtins.Symbol',
	'no-template-literals': 'javascript.grammar.template_literals',
	'no-typed-arrays': [
		'javascript.builtins.Int8Array',
		'javascript.builtins.Uint8Array',
		'javascript.builtins.Uint8ClampedArray',
		'javascript.builtins.Int16Array',
		'javascript.builtins.Uint16Array',
		'javascript.builtins.Int32Array',
		'javascript.builtins.Uint32Array',
		'javascript.builtins.Float32Array',
		'javascript.builtins.Float64Array',
		'javascript.builtins.DataView',
	],
	'no-unicode-codepoint-escapes': [
		'javascript.grammar.unicode_point_escapes',
		'javascript.builtins.String.unicode_code_point_escapes',
	],
	'no-weak-map': 'javascript.builtins.WeakMap',
	'no-weak-set': 'javascript.builtins.WeakSet',

	// ES5
	'no-accessor-properties': 'javascript.operators.property_accessors',
	'no-array-isarray': 'javascript.builtins.Array.isArray',
	'no-array-prototype-every': 'javascript.builtins.Array.every',
	'no-array-prototype-filter': 'javascript.builtins.Array.filter',
	'no-array-prototype-foreach': 'javascript.builtins.Array.forEach',
	'no-array-prototype-indexof': 'javascript.builtins.Array.indexOf',
	'no-array-prototype-lastindexof': 'javascript.builtins.Array.lastIndexOf',
	'no-array-prototype-map': 'javascript.builtins.Array.map',
	'no-array-prototype-reduce': 'javascript.builtins.Array.reduce',
	'no-array-prototype-reduceright': 'javascript.builtins.Array.reduceRight',
	'no-array-prototype-some': 'javascript.builtins.Array.some',
	'no-date-now': 'javascript.builtins.Date.now',
	'no-function-prototype-bind': 'javascript.builtins.Function.bind',
	'no-json': 'javascript.builtins.JSON',
	'no-keyword-properties': false, // No support data.
	'no-object-create': 'javascript.builtins.Object.create',
	'no-object-defineproperties': 'javascript.builtins.Object.defineProperties',
	'no-object-defineproperty': 'javascript.builtins.Object.defineProperty',
	'no-object-freeze': 'javascript.builtins.Object.freeze',
	'no-object-getownpropertydescriptor': 'javascript.builtins.Object.getOwnPropertyDescriptor',
	'no-object-getownpropertynames': 'javascript.builtins.Object.getOwnPropertyNames',
	'no-object-getprototypeof': 'javascript.builtins.Object.getPrototypeOf',
	'no-object-isextensible': 'javascript.builtins.Object.isExtensible',
	'no-object-isfrozen': 'javascript.builtins.Object.isFrozen',
	'no-object-issealed': 'javascript.builtins.Object.isSealed',
	'no-object-keys': 'javascript.builtins.Object.keys',
	'no-object-preventextensions': 'javascript.builtins.Object.preventExtensions',
	'no-object-seal': 'javascript.builtins.Object.seal',
	'no-string-prototype-trim': 'javascript.builtins.String.trim',
	'no-trailing-commas': [
		'javascript.grammar.trailing_commas',
		'javascript.grammar.trailing_commas.trailing_commas_in_object_literals',
	],

	// Annex B
	'no-date-prototype-getyear-setyear': [
		'javascript.builtins.Date.getYear',
		'javascript.builtins.Date.setYear',
	],
	'no-date-prototype-togmtstring': 'javascript.builtins.Date.toGMTString',
	'no-escape-unescape': [ 'javascript.builtins.escape', 'javascript.builtins.unescape' ],
	'no-function-declarations-in-if-statement-clauses-without-block': false, // No support data.
	'no-initializers-in-for-in': false, // No support data.
	'no-labelled-function-declarations': false, // No support data.
	'no-regexp-prototype-compile': 'javascript.builtins.RegExp.compile',
	'no-shadow-catch-param': false, // No support data.
	'no-string-create-html-methods': [
		'javascript.builtins.String.anchor',
		'javascript.builtins.String.big',
		'javascript.builtins.String.blink',
		'javascript.builtins.String.bold',
		'javascript.builtins.String.fixed',
		'javascript.builtins.String.fontcolor',
		'javascript.builtins.String.fontsize',
		'javascript.builtins.String.italics',
		'javascript.builtins.String.link',
		'javascript.builtins.String.small',
		'javascript.builtins.String.strike',
		'javascript.builtins.String.sub',
		'javascript.builtins.String.sup',
	],
	'no-string-prototype-substr': 'javascript.builtins.String.substr',
	'no-string-prototype-trimleft-trimright': false, // No support data.

	// Other legacy
	'no-legacy-object-prototype-accessor-methods': [
		'javascript.builtins.Object.defineGetter',
		'javascript.builtins.Object.defineSetter',
		'javascript.builtins.Object.lookupGetter',
		'javascript.builtins.Object.lookupSetter',
	],
};
