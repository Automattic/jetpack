import { useMediaQuery } from '@wordpress/compose';
import { Button, IconButton } from '@wordpress/ui';
import { forwardRef } from 'react';
import type { ComponentProps, ForwardRefExoticComponent, RefAttributes } from 'react';

// At this width and below, page actions show only their icon so the header's title keeps its room.
const NARROW_SCREEN_QUERY = '(max-width: 390px)';

export type PageActionButtonProps = ComponentProps< typeof IconButton >;

/**
 * A page action for `AdminPage`'s `actions`: a labelled button, or an icon button on narrow screens.
 *
 * The label stays the button's accessible name, and becomes its tooltip when only the icon shows.
 */
const PageActionButton: ForwardRefExoticComponent<
	PageActionButtonProps & RefAttributes< HTMLButtonElement >
> = forwardRef< HTMLButtonElement, PageActionButtonProps >(
	( { label, icon, shortcut, positioner, ...buttonProps }, ref ) => {
		const isNarrowScreen = useMediaQuery( NARROW_SCREEN_QUERY );

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
);

PageActionButton.displayName = 'PageActionButton';

export default PageActionButton;
