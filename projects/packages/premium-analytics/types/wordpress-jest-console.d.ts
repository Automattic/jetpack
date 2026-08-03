/**
 * Matcher declarations for `@wordpress/jest-console` (loaded by the shared
 * jest setup). The package ships these in its own `declarations.d.ts`, but
 * that file is not part of this tsconfig's type roots, so the subset used by
 * tests is declared here.
 */
declare namespace jest {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- mirrors the upstream interface signature.
	interface Matchers< R, T > {
		toHaveErrored(): R;
		toHaveErroredWith( ...args: unknown[] ): R;
		toHaveWarned(): R;
		toHaveWarnedWith( ...args: unknown[] ): R;
	}
}
