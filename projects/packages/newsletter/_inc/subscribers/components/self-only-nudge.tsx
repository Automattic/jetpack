import { useViewportMatch } from '@wordpress/compose';
import { createInterpolateElement, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { IconButton, Popover, Stack } from '@wordpress/ui';

type Props = {
	anchor: HTMLElement | null;
	onDismiss: ( reason: string ) => void;
};

/**
 * Points a creator at the "Add subscribers" button when their own subscription is the only one on
 * the site.
 *
 * Presentational: `SubscribersBody` decides when this shows and records its Tracks events, because
 * this component unmounts whenever a search hides the nudge or the Settings tab takes over.
 *
 * @param props           - Component props.
 * @param props.anchor    - Element to sit beside (the header button).
 * @param props.onDismiss - Called with the reason the popover closed.
 * @return Popover, or null before the anchor mounts.
 */
export default function SelfOnlyNudge( { anchor, onDismiss }: Props ): JSX.Element | null {
	// No room beside the button once wp-admin goes mobile, so drop it under the button instead.
	const isNarrow = useViewportMatch( 'medium', '<' );
	const popupRef = useRef< HTMLDivElement >( null );

	// Base UI reports the ✕, Escape and an outside press through one callback, and binds Escape on
	// the document — so a press aimed at a DataViews dropdown or the search field reaches us too,
	// and the ✕'s own tooltip swallows the ones that were aimed here. Only the ✕ is unambiguously a
	// decision about the nudge. `open` stays true, so ignoring the rest just leaves the popover up.
	const handleOpenChange = useCallback(
		( isOpen: boolean, { reason }: { reason: string } ) => {
			if ( isOpen || reason !== 'close-press' ) {
				return;
			}
			// Dismissing unmounts the popup. Hand focus back to the button it pointed at, rather
			// than letting it fall to `<body>` and sending a keyboard visitor back to the top.
			const popup = popupRef.current;
			if ( popup?.contains( popup.ownerDocument.activeElement ) ) {
				anchor?.focus();
			}
			onDismiss( reason );
		},
		[ anchor, onDismiss ]
	);

	if ( ! anchor ) {
		return null;
	}

	return (
		<Popover.Root open onOpenChange={ handleOpenChange }>
			<Popover.Popup
				ref={ popupRef }
				className="jetpack-newsletter-self-only-nudge"
				// Nobody asked for this popover, so it must not take focus off whatever the visitor
				// is doing. `Popover.Title` still names it for assistive technology.
				initialFocus={ false }
				positioner={
					<Popover.Positioner
						anchor={ anchor }
						side={ isNarrow ? 'bottom' : 'inline-start' }
						align={ isNarrow ? 'end' : 'start' }
					/>
				}
			>
				<Popover.Arrow />
				<Stack direction="row" align="flex-start" justify="space-between" gap="sm">
					<Stack direction="column" gap="sm">
						<Popover.Title>
							{ __( 'Every newsletter starts at one', 'jetpack-newsletter' ) }
						</Popover.Title>
						<Popover.Description>
							{ createInterpolateElement(
								__(
									'Yours is no exception. Add a few people who already know you: <who>friends, family, coworkers</who>.',
									'jetpack-newsletter'
								),
								{ who: <em /> }
							) }
						</Popover.Description>
					</Stack>
					<Popover.Close
						render={
							<IconButton
								icon={ close }
								label={ __( 'Dismiss', 'jetpack-newsletter' ) }
								size="small"
								variant="minimal"
							/>
						}
					/>
				</Stack>
			</Popover.Popup>
		</Popover.Root>
	);
}
