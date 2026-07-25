/**
 * Format API keys into display labels, with an optional map for known labels.
 *
 * @param key    - Raw API key.
 * @param labels - Known display labels keyed by lower-cased API key.
 * @return Display label.
 */
export function formatDisplayLabel( key: string, labels: Record< string, string > = {} ): string {
	const normalized = key.toLowerCase();

	return labels[ normalized ] ?? key.charAt( 0 ).toUpperCase() + key.slice( 1 );
}
