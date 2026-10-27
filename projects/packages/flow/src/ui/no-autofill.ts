/** Keeps browsers and password managers from offering to sign in on Flow's own fields. */
export const noAutofill = {
	autoComplete: 'off',
	'data-1p-ignore': true,
	'data-lpignore': 'true',
	'data-bwignore': 'true',
	'data-form-type': 'other',
} as const;
