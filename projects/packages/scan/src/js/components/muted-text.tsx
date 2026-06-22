import { Text } from '@wordpress/ui';
import type { ComponentProps } from 'react';

/**
 * De-emphasized text.
 *
 * `@wordpress/ui`'s `Text` has no muted/secondary color prop yet, so this thin
 * wrapper applies the design-system muted foreground color while forwarding all
 * other `Text` props (variant, className, style, etc.). A caller-provided
 * `style` is merged last so it can extend (or override) the color when needed.
 *
 * Replace usages with a native `Text` prop if one lands upstream.
 *
 * @param props - `Text` props.
 * @return The muted text element.
 */
export default function MutedText( props: ComponentProps< typeof Text > ) {
	return (
		<Text
			{ ...props }
			style={ { color: 'var(--wpds-color-fg-content-neutral-weak, #50575e)', ...props.style } }
		/>
	);
}
