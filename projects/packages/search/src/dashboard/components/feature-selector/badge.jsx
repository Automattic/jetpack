/**
 * Small status pill used for "RECOMMENDED" and "ACTIVE" labels on a feature
 * tile. Intentionally local to feature-selector — `@wordpress/ui` does not
 * yet ship a Badge primitive, and the inline alternative (a styled span)
 * would obscure the intent at the call site.
 *
 * The label visible to sighted users is uppercase by CSS; the `aria-label`
 * passed in is what screen readers announce.
 *
 * @param {object}                 props           - Component props.
 * @param {'recommended'|'active'} props.variant   - Color treatment.
 * @param {string}                 props.children  - Visible label text.
 * @param {string}                 props.ariaLabel - Screen-reader label.
 * @return {import('react').Element} - The badge element.
 */
export default function Badge( { variant, children, ariaLabel } ) {
	return (
		<span
			className={ `jp-search-feature-selector__badge jp-search-feature-selector__badge--${ variant }` }
			aria-label={ ariaLabel }
		>
			{ children }
		</span>
	);
}
