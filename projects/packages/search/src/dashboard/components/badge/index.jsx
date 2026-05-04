import './style.scss';

/**
 * Small status pill used for short labels such as "RECOMMENDED" and "ACTIVE".
 * `@wordpress/components` does not yet ship a Badge primitive, so we keep a
 * minimal local one. The visible label is uppercased by CSS; the `aria-label`
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
		<span className={ `jp-search-badge jp-search-badge--${ variant }` } aria-label={ ariaLabel }>
			{ children }
		</span>
	);
}
