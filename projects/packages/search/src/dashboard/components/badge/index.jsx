import './style.scss';

/**
 * Small status pill aligned with the WPDS Badge primitive's intent system.
 * `@wordpress/components` does not yet ship a Badge of its own, so we keep
 * a minimal local one with the same intent vocabulary.
 *
 * @param {object}                    props           - Component props.
 * @param {'informational'|'success'} props.intent    - Color treatment, mirrors WPDS Badge intents.
 * @param {string}                    props.children  - Visible label text.
 * @param {string}                    props.ariaLabel - Screen-reader label.
 * @return {import('react').Element} - The badge element.
 */
export default function Badge( { intent, children, ariaLabel } ) {
	return (
		<span className={ `jp-search-badge jp-search-badge--${ intent }` } aria-label={ ariaLabel }>
			{ children }
		</span>
	);
}
