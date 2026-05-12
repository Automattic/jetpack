import { CheckboxControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Link, Stack, Text } from '@wordpress/ui';
import './placement-card.scss';
import type { ReactNode } from 'react';

interface PlacementCardProps {
	/**
	 * Stable id used to bind the visible card to the underlying checkbox via
	 * `<label htmlFor>` and `aria-labelledby` — letting screen readers
	 * announce the card title as the checkbox name and giving the whole
	 * preview surface a native click-to-toggle target.
	 */
	id: string;
	/**
	 * Stable name passed back to the parent's `onChange` so a single
	 * change handler can be shared across the whole grid without binding a
	 * closure per row in render.
	 */
	name: string;
	/** Caption rendered below the card. Also used as the checkbox's accessible name. */
	title: string;
	/** Slot for the placement illustration (16:9-ish wireframe / mock). */
	illustration?: ReactNode;
	/** When true, the card border + checkbox both pick up the selected state. */
	checked: boolean;
	/** Called with the placement `name` and the next checked value. */
	onChange: ( name: string, next: boolean ) => void;
	/**
	 * Optional editor URL — when present, renders a "Preview and edit"
	 * link below the title that opens the corresponding template / part in
	 * the Site Editor.
	 */
	previewUrl?: string;
	/**
	 * Optional callback fired when the "Preview and edit" link is clicked.
	 * Receives the same `name` the change handler does so the parent can
	 * fire a per-placement Tracks event without binding closures per row.
	 */
	onPreviewClick?: ( name: string ) => void;
	/** Disable the whole card (parent section gates on `data.subscriptions`). */
	disabled?: boolean;
}

/**
 * Selectable card for a subscribe-placement option (Image #5). Built on the
 * WPDS `Card.Root` primitive: the card surface + border + radius + background
 * come from Card; selected/hover/focus states are layered on via a small SCSS
 * file. `<label htmlFor>` makes the illustration a click target and
 * `aria-labelledby` borrows the visible title (rendered outside the label, in
 * the caption Stack) as the checkbox's accessible name.
 *
 * @param props                - Component props.
 * @param props.id             - Stable id used to bind the checkbox to the visual surface.
 * @param props.name           - Stable name passed back to the parent's `onChange`.
 * @param props.title          - Caption rendered below the card; also the checkbox's accessible name.
 * @param props.illustration   - Slot for the placement preview wireframe.
 * @param props.checked        - Whether this placement is currently selected.
 * @param props.onChange       - Called with `(name, next)` when the user toggles.
 * @param props.previewUrl     - Optional Site Editor URL that backs the "Preview and edit" link.
 * @param props.onPreviewClick - Optional callback fired when the "Preview and edit" link is clicked.
 * @param props.disabled       - Disables the whole card (gated by the section's `data.subscriptions`).
 * @return Selectable placement card.
 */
export function PlacementCard( {
	id,
	name,
	title,
	illustration,
	checked,
	onChange,
	previewUrl,
	onPreviewClick,
	disabled,
}: PlacementCardProps ): JSX.Element {
	const titleId = `${ id }__title`;

	const handleChange = useCallback(
		( next: boolean ) => onChange( name, next ),
		[ name, onChange ]
	);

	const handlePreviewClick = useCallback( () => {
		onPreviewClick?.( name );
	}, [ name, onPreviewClick ] );

	return (
		<Stack gap="sm" direction="column">
			<Card.Root className="jetpack-newsletter-placement__card" data-checked={ checked }>
				{ /* The label wraps only the preview surface so clicking
				     anywhere on the illustration toggles the checkbox.
				     The title and link sit OUTSIDE so they don't toggle on
				     accidental click. */ }
				<label htmlFor={ id } className="jetpack-newsletter-placement__surface">
					<div className="jetpack-newsletter-placement__illustration">{ illustration }</div>
				</label>
				<div className="jetpack-newsletter-placement__checkbox">
					<CheckboxControl
						__nextHasNoMarginBottom
						id={ id }
						checked={ checked }
						onChange={ handleChange }
						disabled={ disabled }
						aria-labelledby={ titleId }
						/* The visible label is the title rendered below; this
						   inline label exists only as a fallback name for AT
						   if `aria-labelledby` doesn't resolve. */
						label=""
					/>
				</div>
			</Card.Root>
			<Stack gap="xs" direction="column">
				<Text id={ titleId } variant="body-sm">
					{ title }
				</Text>
				{ previewUrl && (
					<Link href={ previewUrl } onClick={ handlePreviewClick }>
						{ __( 'Preview and edit', 'jetpack-newsletter' ) }
					</Link>
				) }
			</Stack>
		</Stack>
	);
}
