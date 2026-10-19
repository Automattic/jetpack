/**
 * A number in the page's locale.
 *
 * @param value   - The number.
 * @param options - Intl.NumberFormat options, such as a percent style.
 * @return The formatted number.
 */
export default function formatNumber( value: number, options?: Intl.NumberFormatOptions ): string {
	try {
		return new Intl.NumberFormat( document.documentElement.lang || undefined, options ).format(
			value
		);
	} catch {
		// WordPress prints locales Intl rejects, such as pt-PT-ao90.
		return new Intl.NumberFormat( undefined, options ).format( value );
	}
}
