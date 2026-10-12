/**
 * A line chart glyph, copied from the dashboard's `chartLine` (`@wordpress/icons` has only
 * `chartBar`): a widget declares the icons of its options as elements, and nothing resolves an
 * icon by name yet. Resolving icons globally, by name through the host, retires this copy.
 */
export const chartLine = (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
		<path
			d="M5.5 15.75L10 10.25L14 13.75L18.5 7.25"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);
