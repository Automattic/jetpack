const optionValues = options => options.map( option => option.value );

export const languageOptions = [
	{ value: 'en-US', label: 'English' },
	{ value: 'fr-CA', label: 'Français' },
	{ value: 'de-DE', label: 'Deutsch' },
	{ value: 'es-MX', label: 'Español' },
	{ value: 'ja-JP', label: '日本語' },
	{ value: 'nl-NL', label: 'Nederlands' },
	{ value: 'it-IT', label: 'Italiano' },
];
export const languageValues = optionValues( languageOptions );
