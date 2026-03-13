declare module '@@codemirrorLanguageData@@' {
	/**
	 * Array of tuples mapping file extensions to language names:
	 *
	 * @example
	 *     [
	 *       [ "cpp", "C++" ],
	 *       [ "ts", "TypeScript" ],
	 *       // …
	 *     ]
	 */
	export const extensionToLang: ReadonlyArray< [ extension: string, langName: string ] >;
}
