/**
 * External dependencies
 */
import { Card, Drawer, Stack, Text } from '@jetpack-premium-analytics/externals';
import { isRTL } from '@wordpress/i18n';
import { useCallback, type ReactNode } from 'react';
/**
 * Internal dependencies
 */
import styles from './page-drawer.module.scss';

export type PageDrawerProps = {
	/** Whether the drawer is open. */
	open: boolean;
	/** Called once the reader dismisses the drawer. */
	onClose: () => void;
	/** The drawer's heading, which also names the dialog. */
	title: string;
	/** Keeps the drawer open while true, such as during a save. */
	isBusy?: boolean;
	/** `Drawer.Content`, and `Drawer.Footer` where the drawer has actions. */
	children: ReactNode;
};

export type DrawerGroupProps = {
	/** The group's heading. */
	title: string;
	/** The group's content, shown in one card. */
	children: ReactNode;
};

/**
 * A panel of the page options menu, sliding in from the end of the page below the admin bar.
 *
 * The children mount with the popup and unmount once it has slid out, so state kept in them starts over on each opening.
 *
 * @param props          - Component props.
 * @param props.open     - Whether the drawer is open.
 * @param props.onClose  - Called once the reader dismisses the drawer.
 * @param props.title    - The drawer's heading.
 * @param props.isBusy   - Keeps the drawer open while true.
 * @param props.children - The drawer's content and footer.
 * @return The drawer.
 */
export function PageDrawer( { open, onClose, title, isBusy = false, children }: PageDrawerProps ) {
	const handleOpenChange = useCallback(
		( nextOpen: boolean ) => {
			if ( ! nextOpen && ! isBusy ) {
				onClose();
			}
		},
		[ isBusy, onClose ]
	);

	return (
		// The Drawer anchors to a physical edge, so the page's end edge is picked here.
		<Drawer.Root
			open={ open }
			onOpenChange={ handleOpenChange }
			swipeDirection={ isRTL() ? 'left' : 'right' }
		>
			<Drawer.Popup size="large" className={ styles.popup }>
				<Drawer.Header>
					<Drawer.Title>{ title }</Drawer.Title>
					<Drawer.CloseIcon />
				</Drawer.Header>
				{ children }
			</Drawer.Popup>
		</Drawer.Root>
	);
}

/**
 * One titled group of a drawer's content.
 *
 * @param props          - Component props.
 * @param props.title    - The group's heading.
 * @param props.children - The group's content.
 * @return The group.
 */
export function DrawerGroup( { title, children }: DrawerGroupProps ) {
	return (
		<Stack direction="column" gap="md" render={ <section /> }>
			<Text variant="heading-md" render={ <h3 /> }>
				{ title }
			</Text>
			<Card.Root>
				<Card.Content>
					<Stack direction="column" gap="xl">
						{ children }
					</Stack>
				</Card.Content>
			</Card.Root>
		</Stack>
	);
}
