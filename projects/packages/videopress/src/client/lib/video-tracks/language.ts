const GENERATED_LANGUAGE_KEY_PATTERN = /^auto[_-]/i;

/**
 * Subtitle language tags offered in the language picker. The set mirrors the
 * breadth of languages WordPress itself ships locales for (living world
 * languages plus the most common regional/script variants). Display names are
 * derived at runtime via `Intl.DisplayNames`, so the list localizes to the
 * user's admin language automatically and never needs translating here.
 */
export const LANGUAGE_TAGS = [
	'af',
	'am',
	'ar',
	'hy',
	'as',
	'az',
	'eu',
	'be',
	'bn',
	'bs',
	'bg',
	'my',
	'ca',
	'zh-Hans',
	'zh-Hant',
	'co',
	'hr',
	'cs',
	'da',
	'nl',
	'en',
	'en-GB',
	'en-US',
	'eo',
	'et',
	'fil',
	'fi',
	'fr',
	'fr-CA',
	'fy',
	'gl',
	'ka',
	'de',
	'el',
	'gu',
	'ht',
	'ha',
	'haw',
	'he',
	'hi',
	'hu',
	'is',
	'ig',
	'id',
	'ga',
	'it',
	'ja',
	'jv',
	'kn',
	'kk',
	'km',
	'rw',
	'ko',
	'ku',
	'ky',
	'lo',
	'la',
	'lv',
	'lt',
	'lb',
	'mk',
	'mg',
	'ms',
	'ml',
	'mt',
	'mi',
	'mr',
	'mn',
	'ne',
	'nb',
	'nn',
	'no',
	'ny',
	'or',
	'ps',
	'fa',
	'pl',
	'pt',
	'pt-BR',
	'pa',
	'ro',
	'ru',
	'sm',
	'gd',
	'sr',
	'sn',
	'sd',
	'si',
	'sk',
	'sl',
	'so',
	'st',
	'es',
	'es-419',
	'su',
	'sw',
	'sv',
	'tg',
	'ta',
	'tt',
	'te',
	'th',
	'ti',
	'tr',
	'tk',
	'uk',
	'ur',
	'ug',
	'uz',
	'vi',
	'cy',
	'xh',
	'yi',
	'yo',
	'zu',
];

let languageDisplayNames: Intl.DisplayNames | null | undefined;
let regionDisplayNames: Intl.DisplayNames | null | undefined;

/**
 * Lazily build (and cache) an `Intl.DisplayNames` instance for language names.
 *
 * @return The instance, or null when the environment doesn't support it.
 */
function getLanguageDisplayNames(): Intl.DisplayNames | null {
	if ( languageDisplayNames === undefined ) {
		try {
			languageDisplayNames = new Intl.DisplayNames( undefined, { type: 'language' } );
		} catch {
			languageDisplayNames = null;
		}
	}

	return languageDisplayNames;
}

/**
 * Short, friendly label for a region subtag, e.g. `US`, `UK`, `BR`. Numeric
 * UN M49 regions (such as `419`) fall back to their localized name.
 *
 * @param region - Region subtag from a BCP-47 tag.
 * @return Region label.
 */
function getRegionLabel( region: string ): string {
	if ( region === 'GB' ) {
		return 'UK';
	}

	if ( /^[A-Z]{2}$/.test( region ) ) {
		return region;
	}

	if ( regionDisplayNames === undefined ) {
		try {
			regionDisplayNames = new Intl.DisplayNames( undefined, { type: 'region' } );
		} catch {
			regionDisplayNames = null;
		}
	}

	try {
		return regionDisplayNames?.of( region ) || region;
	} catch {
		return region;
	}
}

/**
 * Human-readable, localized name for a BCP-47 language tag. Regional variants
 * render as `Language (REGION)` (e.g. `English (US)`, `Portuguese (BR)`) rather
 * than the dialect form (`American English`).
 *
 * @param value - BCP-47 language tag.
 * @return Display name, or the tag itself when it can't be resolved.
 */
export function getLanguageDisplayName( value: string ): string {
	const canonical = canonicalizeLanguageTag( value ) ?? value.trim();
	const displayNames = getLanguageDisplayNames();

	if ( ! displayNames ) {
		return canonical;
	}

	try {
		const locale = new Intl.Locale( canonical );

		if ( locale.region ) {
			const baseTag = locale.script ? `${ locale.language }-${ locale.script }` : locale.language;
			return `${ displayNames.of( baseTag ) || baseTag } (${ getRegionLabel( locale.region ) })`;
		}

		return displayNames.of( canonical ) || canonical;
	} catch {
		try {
			return displayNames.of( canonical ) || canonical;
		} catch {
			return canonical;
		}
	}
}

/**
 * The admin/site language as a canonical BCP-47 tag, used as the default
 * subtitle language. Falls back to English when it can't be resolved.
 *
 * @return Canonical BCP-47 tag.
 */
export function getSiteLanguageTag(): string {
	const documentLanguage = typeof document !== 'undefined' ? document.documentElement.lang : '';

	return canonicalizeLanguageTag( documentLanguage ) ?? 'en';
}

/**
 * Returns whether a language key is one of VideoPress' generated or legacy
 * values. These keys can be displayed for existing tracks, but they are not
 * valid BCP-47 language tags for a caption track.
 *
 * @param value - Language key.
 * @return Whether the key is generated or legacy.
 */
export function isGeneratedLanguageKey( value: string ): boolean {
	return GENERATED_LANGUAGE_KEY_PATTERN.test( value.trim() );
}

/**
 * Canonicalize a BCP-47 language tag.
 *
 * @param value - BCP-47 language tag.
 * @return Canonical BCP-47 tag, or null when invalid.
 */
export function canonicalizeLanguageTag( value: string ): string | null {
	const trimmed = value.trim();

	if ( ! trimmed || isGeneratedLanguageKey( trimmed ) ) {
		return null;
	}

	try {
		return Intl.getCanonicalLocales( trimmed )[ 0 ] ?? null;
	} catch {
		return null;
	}
}

/**
 * Format an existing track language key for display. Invalid legacy keys are
 * intentionally preserved instead of normalized away.
 *
 * @param value - Existing track language key.
 * @return Display value.
 */
export function formatLanguageTagForDisplay( value: string ): string {
	const canonical = canonicalizeLanguageTag( value );
	return canonical ?? value;
}

/**
 * Convert an existing VideoPress language key into an editable BCP-47 language
 * tag for the caption editor. Generated keys such as `auto_en` are source
 * identifiers, but their suffix often still contains the real language code.
 *
 * @param value - Existing track language key.
 * @return Canonical language tag, or empty string when it cannot be inferred.
 */
export function getManualLanguageTagFromTrackKey( value: string ): string {
	if ( ! isGeneratedLanguageKey( value ) ) {
		return canonicalizeLanguageTag( value ) ?? '';
	}

	const language = value.trim().replace( GENERATED_LANGUAGE_KEY_PATTERN, '' ).replace( /_/g, '-' );
	return canonicalizeLanguageTag( language ) ?? '';
}
