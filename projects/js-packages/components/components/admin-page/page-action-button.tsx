import { useViewportMatch } from '@wordpress/compose';
import { Button, IconButton } from '@wordpress/ui';
import { forwardRef } from 'react';
import type { ComponentProps, ForwardRefExoticComponent, ForwardedRef, RefAttributes } from 'react';

type PageActionButtonProps = ComponentProps< typeof IconButton >;

/**
 * A page action for `AdminPage`'s `actions`: a labelled button, or an icon button on narrow screens.
 *
 * The label stays the button's accessible name, and becomes its tooltip when only the icon shows.
 *
 * @param props            - Any `Button` prop, plus the ones below.
 * @param props.label      - The button's text, or its tooltip when only the icon shows.
 * @param props.icon       - The icon shown on narrow screens.
 * @param props.shortcut   - Shown in the icon button's tooltip.
 * @param props.positioner - Positions the icon button's tooltip.
 * @param ref              - Forwarded to the rendered button.
 * @return The button.
 */
function PageActionButton(
	{ label, icon, shortcut, positioner, ...buttonProps }: PageActionButtonProps,
	ref: ForwardedRef< HTMLButtonElement >
) {
	// On phones, page actions show only their icon so the header's title keeps its room.
	const isNarrowScreen = useViewportMatch( 'mobile', '<' );

	if ( isNarrowScreen ) {
		return (
			<IconButton
				ref={ ref }
				label={ label }
				icon={ icon }
				shortcut={ shortcut }
				positioner={ positioner }
				{ ...buttonProps }
			/>
		);
	}

	return (
		<Button ref={ ref } { ...buttonProps }>
			{ label }
		</Button>
	);
}

const ForwardedPageActionButton: ForwardRefExoticComponent<
	PageActionButtonProps & RefAttributes< HTMLButtonElement >
> = forwardRef( PageActionButton );

export default ForwardedPageActionButton;
