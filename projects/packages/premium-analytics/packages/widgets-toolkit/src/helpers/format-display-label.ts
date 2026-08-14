/**
 * Format API keys into display labels, with an optional map for known labels.
 *
 * @param key    - Raw API key.
 * @param labels - Known display labels keyed by lower-cased API key.
 * @return Display label.
 */
export function formatDisplayLabel( key: string, labels: Record< string, string > = {} ): string {
	const normalized = key.toLowerCase();
	// Own-property only: a key such as `toString` would otherwise resolve to an
	// inherited `Object.prototype` member and return a function.
	if ( Object.prototype.hasOwnProperty.call( labels, normalized ) ) {
		return labels[ normalized ];
	}

	return key.charAt( 0 ).toUpperCase() + key.slice( 1 );
}
