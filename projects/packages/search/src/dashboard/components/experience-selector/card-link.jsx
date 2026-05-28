/**
 * Small text-link CTA at the bottom of an experience card — "Edit search
 * template", "Restore default", etc. Renders as an `<a>` when actionable
 * and a non-interactive `<span>` when disabled (AT shouldn't announce a
 * link the user can't follow), with the same `→` glyph either way so the
 * row's visual rhythm doesn't shift on state changes.
 *
 * @param {object}   props           - Props.
 * @param {string}   props.label     - Visible link text.
 * @param {string}   props.href      - Link target — used only when not disabled.
 * @param {boolean}  props.disabled  - When true, renders as a muted non-clickable span.
 * @param {Function} [props.onClick] - Optional click handler — `event.preventDefault()` callers are responsible for guarding their own no-navigation logic.
 * @return {import('react').Element} - The card link element.
 */
export default function CardLink( { label, href, disabled, onClick } ) {
	if ( disabled ) {
		// Render as a non-interactive <span> so AT doesn't announce a
		// link the user can't follow. The `is-disabled` class is the
		// CSS hook for the muted/not-allowed visual state —
		// `aria-disabled` on a roleless <span> has no semantic effect
		// for AT.
		return (
			<span className="jp-search-experience-option__action jp-search-experience-option__action-link is-disabled">
				{ label }
				<span aria-hidden="true"> →</span>
			</span>
		);
	}
	return (
		<a
			className="jp-search-experience-option__action jp-search-experience-option__action-link"
			href={ href }
			onClick={ onClick }
		>
			{ label }
			<span aria-hidden="true"> →</span>
		</a>
	);
}
