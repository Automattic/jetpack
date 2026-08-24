import { Icon } from '@wordpress/components';
import { Button, Text } from '@wordpress/ui';
import type { ReactElement } from 'react';

type Props = {
	icon: Parameters< typeof Icon >[ 0 ][ 'icon' ];
	label: string;
	disabled?: boolean;
	onClick: () => void;
};

/**
 * One action tile in the Thumbnail card: a 16:9 dashed frame with an icon
 * above a centred label, sized to match the poster preview beside it.
 *
 * Hand-rolled rather than composed, because the design system has nothing for
 * this. `@wordpress/ui` ships no media picker, upload tile or dashed
 * container — the only `dashed` rule in the package is inside a Popover
 * story — and there is no `border-style` token. `EmptyState` is the closest
 * shape (icon → title → description) but it is a centred full-width empty
 * state, not a picker, and carries no dashed treatment. `FormFileUpload`
 * opens a raw file input, where these two actions need the WP media modal and
 * the frame scrubber. `MediaPlaceholder` is the canonical WordPress dashed
 * box, but it lives in `@wordpress/block-editor` and is editor-canvas
 * furniture.
 *
 * So the interaction is borrowed and only the surface is local: `Button` with
 * `variant="unstyled"` keeps the real <button>, its focus ring and its
 * disabled semantics, and the stylesheet paints the frame from WPDS tokens.
 *
 * @param props          - Component props.
 * @param props.icon     - Icon rendered above the label.
 * @param props.label    - Visible, and the button's accessible name.
 * @param props.disabled - Greys the tile out and blocks the click.
 * @param props.onClick  - Fired when the tile is activated.
 * @return The tile element.
 */
export default function ThumbnailTile( {
	icon,
	label,
	disabled = false,
	onClick,
}: Props ): ReactElement {
	return (
		<Button
			variant="unstyled"
			className="vp-thumbnail-tile"
			disabled={ disabled }
			onClick={ onClick }
		>
			<Icon icon={ icon } size={ 24 } />
			<Text className="vp-thumbnail-tile__label">{ label }</Text>
		</Button>
	);
}
