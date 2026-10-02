// ---- Base Types ----

type Specifiers = {
	s: string;
	d: number;
	f: number;
};

type S = keyof Specifiers;

// ---- Tuple Math Utilities ----

// Builds a tuple of length L
type BuildTuple<L extends number, T extends any[] = []> = T['length'] extends L
	? T
	: BuildTuple<L, [any, ...T]>;

// Adds two numbers by building and merging tuples
type Add<A extends number, B extends number> = [
	...BuildTuple<A>,
	...BuildTuple<B>,
]['length'] extends infer R extends number
	? R
	: never;

// --- Escaped Percent Handling ----

// Removes escaped double-percent (%%) sequences from a format string
type StripEscapedPercents<T extends string> =
	T extends `${infer Head}%%${infer Tail}`
		? `${Head}${StripEscapedPercents<Tail>}`
		: T;

// ---- Specifier Utilities ----

// Checks if a character is a valid format specifier
type IsValidSpec<C extends string> = C extends S ? C : never;
// ---- Format Specifier Parsing ----

// Parses precision and format specifier, supports dynamic precision (e.g. %.*f)
type ParsePrecisionAndSpec<T extends string> =
	T extends `.*${infer RawSpec}${infer Rest}`
		? IsValidSpec<RawSpec> extends infer Spec extends S
			? ['.*', Spec, Rest]
			: never
		: T extends `0.${infer PrecisionAndSpec}${infer RestAfterDigits}`
			? PrecisionAndSpec extends `${number}`
				? RestAfterDigits extends `${infer RawSpec}${infer Rest}`
					? IsValidSpec<RawSpec> extends infer Spec extends S
						? [`.${PrecisionAndSpec}`, Spec, Rest]
						: never
					: never
				: never
			: T extends `.${infer PrecisionAndSpec}${infer RestAfterDigits}`
				? PrecisionAndSpec extends `${number}`
					? RestAfterDigits extends `${infer RawSpec}${infer Rest}`
						? IsValidSpec<RawSpec> extends infer Spec extends S
							? [`.${PrecisionAndSpec}`, Spec, Rest]
							: never
						: never
					: never
				: T extends `${infer RawSpec}${infer Rest}`
					? IsValidSpec<RawSpec> extends infer Spec extends S
						? ['', Spec, Rest]
						: never
					: never;

// ---- Positional Placeholder Parsing ----

// Recursively collects all positional placeholders and their expected types
type CollectPositionalPlaceholders<
	T extends string,
	Collected extends Record<string, any> = {},
> =
	StripEscapedPercents<T> extends `${infer _}%${infer PosStr}$${infer AfterPos}`
		? PosStr extends `${number}`
			? ParsePrecisionAndSpec<AfterPos> extends [
					infer Precision extends string,
					infer Spec extends S,
					infer Rest extends string,
				]
				? IsValidSpec<Spec> extends never
					? never
					: Precision extends '.*'
						? CollectPositionalPlaceholders<
								Rest,
								Collected & { [K in PosStr]: [number, Specifiers[Spec]] }
							>
						: CollectPositionalPlaceholders<
								Rest,
								Collected & { [K in PosStr]: Specifiers[Spec] }
							>
				: CollectPositionalPlaceholders<AfterPos, Collected>
			: Collected
		: Collected;

// ---- Positional Argument Extraction ----

// Gets the max index used in positional placeholders
type GetMaxPosition<T extends Record<string, any>> = {
	[K in keyof T]: K extends `${infer N extends number}` ? N : never;
}[keyof T];

// Computes max of a number by building up a tuple
type Max<N extends number, A extends any[] = []> = [N] extends [
	Partial<A>['length'],
]
	? A['length']
	: Max<N, [0, ...A]>;

// Builds a final tuple of arguments from the collected positional types
type BuildPositionalTuple<
	Collected extends { [K: number]: any },
	MaxPos extends number,
	CurrentPos extends number = 1,
	Result extends any[] = [],
> =
	CurrentPos extends Add<MaxPos, 1>
		? Result
		: `${CurrentPos}` extends keyof Collected
			? Collected[CurrentPos] extends [any, any]
				? BuildPositionalTuple<
						Collected,
						MaxPos,
						Add<CurrentPos, 1>,
						[...Result, ...Collected[CurrentPos]]
					>
				: BuildPositionalTuple<
						Collected,
						MaxPos,
						Add<CurrentPos, 1>,
						[...Result, Collected[CurrentPos]]
					>
			: BuildPositionalTuple<
					Collected,
					MaxPos,
					Add<CurrentPos, 1>,
					[...Result, unknown]
				>;

// Main positional argument extractor
type ExtractPositionalPlaceholders<T extends string> =
	CollectPositionalPlaceholders<T> extends infer Collected extends Record<
		string,
		any
	>
		? keyof Collected extends never
			? []
			: Max<GetMaxPosition<Collected>> extends infer MaxPos extends number
				? BuildPositionalTuple<Collected, MaxPos>
				: []
		: [];

// ---- Unnamed Placeholder Extraction ----

// Extracts unnamed placeholders like %s, %.2f, %.*d (ignores positional/named)
type ExtractUnnamedPlaceholders<T extends string> =
	StripEscapedPercents<T> extends `${infer _}%${infer AfterPercent}`
		? AfterPercent extends `${infer _Num extends `${number}`}$${infer AfterPositional}`
			? ExtractUnnamedPlaceholders<AfterPositional> // Skip positional
			: ParsePrecisionAndSpec<AfterPercent> extends [
						infer Precision extends string,
						infer Spec extends S,
						infer Rest extends string,
				  ]
				? [
						...(Precision extends '.*'
							? [number, Specifiers[Spec]]
							: [Specifiers[Spec]]),
						...ExtractUnnamedPlaceholders<Rest>,
					]
				: []
		: [];

// ---- Named Placeholder Extraction ----

// Extracts named placeholders like %(key)s, %(name).2f
type ExtractNamedPlaceholders<T extends string> =
	StripEscapedPercents<T> extends `${infer _}%(${infer Key})${infer AfterKey}`
		? ParsePrecisionAndSpec<AfterKey> extends [
				infer Precision extends string,
				infer Spec extends S,
				infer Rest extends string,
			]
			? Precision extends '.*'
				? never // Optional: disallow dynamic precision for named
				: { [K in Key]: Specifiers[Spec] } & ExtractNamedPlaceholders<Rest>
			: {}
		: {};

// ---- Format Type Guards ----

// Checks if string has named placeholders
type HasNamedPlaceholders<T extends string> =
	StripEscapedPercents<T> extends `${infer _}%(${string})${string}`
		? true
		: false;

// Checks if string has positional placeholders
type HasPositionalPlaceholders<T extends string> =
	StripEscapedPercents<T> extends `${infer _Before}%${infer Rest}`
		? Rest extends `${infer Index}$${infer _After}`
			? Index extends `${number}`
				? true
				: HasPositionalPlaceholders<Rest>
			: HasPositionalPlaceholders<Rest>
		: false;

// Checks if string has unnamed placeholders
type HasUnnamedPlaceholders<T extends string> =
	StripEscapedPercents<T> extends `${infer _}%${infer Body}`
		? Body extends `(${string})${string}` // Named — skip
			? HasUnnamedPlaceholders<Body>
			: Body extends `${number}$${string}` // Positional — skip
				? HasUnnamedPlaceholders<Body>
				: ParsePrecisionAndSpec<Body> extends [
							infer _,
							infer Spec extends S,
							infer _,
					  ]
					? true
					: HasUnnamedPlaceholders<Body>
		: false;

// ---- Public API ----

// Extracts the argument types required for a sprintf-like string
export type SprintfArgs<T extends string> =
	HasNamedPlaceholders<T> extends true
		? HasPositionalPlaceholders<T> extends true
			? [never] // Invalid: named + positional
			: HasUnnamedPlaceholders<T> extends true
				? [never] // Invalid: named + unnamed
				: [values: ExtractNamedPlaceholders<T>]
		: HasPositionalPlaceholders<T> extends true
			? HasUnnamedPlaceholders<T> extends true
				? [
						...ExtractPositionalPlaceholders<T>,
						...ExtractUnnamedPlaceholders<T>,
					]
				: ExtractPositionalPlaceholders<T>
			: HasUnnamedPlaceholders<T> extends true
				? ExtractUnnamedPlaceholders<T>
				: [];
