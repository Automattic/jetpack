const GENERATED_LANGUAGE_KEY_PATTERN = /^auto[_-]/i;

/**
 * Returns whether a language key is one of VideoPress' generated or legacy
 * values. These keys can be displayed for existing tracks, but they are not
 * valid manual BCP-47 language tags.
 *
 * @param value - Language key.
 * @return Whether the key is generated or legacy.
 */
export function isGeneratedLanguageKey( value: string ): boolean {
	return GENERATED_LANGUAGE_KEY_PATTERN.test( value.trim() );
}

/**
 * Canonicalize a manually-entered BCP-47 language tag.
 *
 * @param value - User-entered language tag.
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
 * Convert an existing VideoPress language key into a manually editable BCP-47
 * language tag. Generated keys such as `auto_en` are source identifiers, but
 * their suffix often still contains the real language code.
 *
 * @param value - Existing track language key.
 * @return Canonical manual language tag, or empty string when it cannot be inferred.
 */
export function getManualLanguageTagFromTrackKey( value: string ): string {
	if ( ! isGeneratedLanguageKey( value ) ) {
		return canonicalizeLanguageTag( value ) ?? '';
	}

	const language = value.trim().replace( GENERATED_LANGUAGE_KEY_PATTERN, '' ).replace( /_/g, '-' );
	return canonicalizeLanguageTag( language ) ?? '';
}
