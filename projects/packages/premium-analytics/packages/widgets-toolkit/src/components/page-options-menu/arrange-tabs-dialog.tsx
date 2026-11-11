/**
 * External dependencies
 */
import { getSectionOrder, setSectionOrder } from '@jetpack-premium-analytics/data';
import { Badge, Dialog, IconButton, Stack, Text } from '@jetpack-premium-analytics/externals';
import { speak } from '@wordpress/a11y';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './arrange-tabs-dialog.module.scss';

export type ArrangeableTab = {
	/*
	 * The tab's slug, as the screen's URL names it.
	 */
	slug: string;

	/*
	 * The tab's label.
	 */
	label: string;
};

export type ArrangeableTabs = {
	/*
	 * The preferences scope of the screen the tabs belong to; their order is stored under it.
	 */
	scope: string;

	/*
	 * The screen's tabs, in the order it shows them.
	 */
	items: ArrangeableTab[];
};

type Step = -1 | 1;

type TabRowProps = {
	/*
	 * The tab the row stands for.
	 */
	tab: ArrangeableTab;

	/*
	 * The row's position, from zero.
	 */
	index: number;

	/*
	 * How many tabs the list holds.
	 */
	count: number;

	/*
	 * Moves the tab at a position one step up or down.
	 */
	onMove: ( index: number, step: Step ) => void;
};

/**
 * A tab in the list, with the buttons that move it.
 *
 * @param {TabRowProps} props - The component props.
 * @return The row.
 */
function TabRow( { tab, index, count, onMove }: TabRowProps ) {
	const moveUp = useCallback( () => onMove( index, -1 ), [ onMove, index ] );
	const moveDown = useCallback( () => onMove( index, 1 ), [ onMove, index ] );

	return (
		<Stack render={ <li /> } direction="row" align="center" gap="sm" className={ styles.row }>
			<Text className={ styles.label }>{ tab.label }</Text>
			{ index === 0 && <Badge>{ __( 'Opens first', 'jetpack-premium-analytics-pkg' ) }</Badge> }
			<IconButton
				icon={ chevronUp }
				label={ sprintf(
					/* translators: %s: the label of a tab. */
					__( 'Move %s up', 'jetpack-premium-analytics-pkg' ),
					tab.label
				) }
				variant="minimal"
				tone="neutral"
				size="compact"
				disabled={ index === 0 }
				onClick={ moveUp }
			/>
			<IconButton
				icon={ chevronDown }
				label={ sprintf(
					/* translators: %s: the label of a tab. */
					__( 'Move %s down', 'jetpack-premium-analytics-pkg' ),
					tab.label
				) }
				variant="minimal"
				tone="neutral"
				size="compact"
				disabled={ index === count - 1 }
				onClick={ moveDown }
			/>
		</Stack>
	);
}

type ArrangeTabsDialogProps = ArrangeableTabs & {
	/*
	 * Called once the reader saves, resets or dismisses the dialog.
	 */
	onClose: () => void;
};

/**
 * Lets the reader put a screen's tabs in the order they want, the first being the one the
 * screen opens on, and stores that order with their preferences.
 *
 * @param {ArrangeTabsDialogProps} props - The component props.
 * @return The dialog.
 */
export function ArrangeTabsDialog( { scope, items, onClose }: ArrangeTabsDialogProps ) {
	const [ tabs, setTabs ] = useState( items );
	const hasOwnOrder = useSelect( select => getSectionOrder( scope, select ).length > 0, [ scope ] );
	const listRef = useRef< HTMLOListElement >( null );
	// React re-inserts a row it moves, which drops the focus: the button to hand it back to.
	const movedRef = useRef< { index: number; step: Step } | undefined >( undefined );

	useLayoutEffect( () => {
		const moved = movedRef.current;

		if ( moved ) {
			movedRef.current = undefined;
			listRef.current?.children[ moved.index ]
				?.querySelectorAll( 'button' )
				[ moved.step === -1 ? 0 : 1 ]?.focus();
		}
	}, [ tabs ] );

	const move = useCallback(
		( index: number, step: Step ) => {
			const next = [ ...tabs ];
			const [ tab ] = next.splice( index, 1 );

			next.splice( index + step, 0, tab );
			movedRef.current = { index: index + step, step };
			setTabs( next );
			speak(
				sprintf(
					/* translators: 1: the label of a tab. 2: its new position. 3: the number of tabs. */
					__( '%1$s moved to position %2$d of %3$d.', 'jetpack-premium-analytics-pkg' ),
					tab.label,
					index + step + 1,
					next.length
				)
			);
		},
		[ tabs ]
	);

	const save = useCallback( () => {
		// Nothing moved: the reader keeps the order they had, their own or the default.
		if ( tabs.some( ( tab, index ) => tab !== items[ index ] ) ) {
			setSectionOrder(
				scope,
				tabs.map( tab => tab.slug )
			);
		}
	}, [ items, scope, tabs ] );

	const reset = useCallback( () => setSectionOrder( scope ), [ scope ] );

	const handleOpenChange = useCallback(
		( nextOpen: boolean ) => {
			if ( ! nextOpen ) {
				onClose();
			}
		},
		[ onClose ]
	);

	// The first tab cannot move up, so the dialog opens on the first button that does something.
	const getInitialFocus = useCallback(
		() => listRef.current?.querySelectorAll( 'button' )[ 1 ] ?? null,
		[]
	);

	return (
		<Dialog.Root open onOpenChange={ handleOpenChange }>
			<Dialog.Popup size="small" initialFocus={ getInitialFocus }>
				<Dialog.Content>
					<Stack direction="column" gap="lg">
						<Stack direction="column" gap="md">
							<Dialog.Title>{ __( 'Arrange tabs', 'jetpack-premium-analytics-pkg' ) }</Dialog.Title>
							<Dialog.Description>
								{ __(
									'The first tab is the one that opens by default.',
									'jetpack-premium-analytics-pkg'
								) }
							</Dialog.Description>
						</Stack>

						<Stack render={ <ol ref={ listRef } /> } direction="column" className={ styles.list }>
							{ tabs.map( ( tab, index ) => (
								<TabRow
									key={ tab.slug }
									tab={ tab }
									index={ index }
									count={ tabs.length }
									onMove={ move }
								/>
							) ) }
						</Stack>
					</Stack>
				</Dialog.Content>
				<Dialog.Footer>
					{ hasOwnOrder && (
						<Dialog.Action
							variant="minimal"
							tone="neutral"
							className={ styles.reset }
							onClick={ reset }
						>
							{ __( 'Reset order', 'jetpack-premium-analytics-pkg' ) }
						</Dialog.Action>
					) }
					<Dialog.Action variant="minimal">
						{ __( 'Cancel', 'jetpack-premium-analytics-pkg' ) }
					</Dialog.Action>
					<Dialog.Action onClick={ save }>
						{ __( 'Save', 'jetpack-premium-analytics-pkg' ) }
					</Dialog.Action>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
