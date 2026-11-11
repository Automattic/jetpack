/**
 * External dependencies
 */
import { getSectionOrder, setSectionOrder } from '@jetpack-premium-analytics/data';
import { Badge, Dialog, IconButton, Stack, Text } from '@jetpack-premium-analytics/externals';
import { speak } from '@wordpress/a11y';
import { useReducedMotion } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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

	/*
	 * Shows the screen an order the reader is trying, as tab slugs, before they save it.
	 * Called with none once the dialog is gone, for the screen to go back to its own.
	 */
	onPreview?: ( order?: string[] ) => void;
};

type Step = -1 | 1;

type Move = {
	/*
	 * The position the tab moved to, from zero.
	 */
	index: number;

	/*
	 * The direction it moved in.
	 */
	step: Step;

	/*
	 * Where each row sat before the move, by tab slug.
	 */
	tops: Map< string, number >;
};

/**
 * Slides each row from where it sat to where it is, the moved one over the others and
 * tinted until it lands, so the eye follows which of them the reader moved.
 *
 * @param rows          - The rows, in their new order.
 * @param tabs          - The tabs, in their new order.
 * @param moved         - The move that put them there.
 * @param reducedMotion - Whether the reader asked for less motion: the tint stays, the slide goes.
 */
function animateMove(
	rows: HTMLElement[],
	tabs: ArrangeableTab[],
	moved: Move,
	reducedMotion: boolean
) {
	const [ firstRow ] = rows;

	// jsdom has no Web Animations.
	if ( typeof firstRow?.animate !== 'function' ) {
		return;
	}

	const tokens = getComputedStyle( firstRow );
	const token = ( name: string ) => tokens.getPropertyValue( name ).trim();
	const duration = parseFloat( token( '--wpds-motion-duration-md' ) ) || 0;
	const easing = token( '--wpds-motion-easing-balanced' ) || 'ease';

	rows.forEach( ( row, index ) => {
		// Drop a slide that is still running, so the row is measured where it really sits.
		row.getAnimations().forEach( animation => animation.cancel() );

		const top = moved.tops.get( tabs[ index ].slug );
		const offset = top === undefined ? 0 : top - row.getBoundingClientRect().top;

		if ( offset !== 0 && ! reducedMotion ) {
			row.animate( [ { transform: `translateY(${ offset }px)` }, { transform: 'none' } ], {
				duration,
				easing,
			} );
		}
	} );

	// The tint reaches past the row's ends, and fades into the dialog's own surface.
	const bleed = token( '--wpds-dimension-padding-sm' );
	const fill = ( color: string ) => ( {
		backgroundColor: color,
		boxShadow: `${ bleed } 0 ${ color }, calc(-1 * ${ bleed }) 0 ${ color }`,
		zIndex: 1,
	} );
	const tint = fill( token( '--wpds-color-background-surface-neutral-weak' ) );
	const surface = fill( token( '--wpds-color-background-surface-neutral-strong' ) );

	// Tinted for the length of the slide, then fading for as long again and a half.
	rows[ moved.index ]?.animate( [ tint, { ...tint, offset: 0.4 }, surface ], {
		duration: duration * 2.5,
	} );
}

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
			{ index === 0 && (
				<Badge className={ styles.badge }>
					{ __( 'Opens first', 'jetpack-premium-analytics-pkg' ) }
				</Badge>
			) }
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
export function ArrangeTabsDialog( { scope, items, onPreview, onClose }: ArrangeTabsDialogProps ) {
	const [ tabs, setTabs ] = useState( items );
	const hasOwnOrder = useSelect( select => getSectionOrder( scope, select ).length > 0, [ scope ] );
	const reducedMotion = useReducedMotion();
	const listRef = useRef< HTMLOListElement >( null );
	// The move the rows have yet to show: read once they are back in the document.
	const movedRef = useRef< Move | undefined >( undefined );

	useLayoutEffect( () => {
		const moved = movedRef.current;
		const rows = Array.from( listRef.current?.children ?? [] ) as HTMLElement[];

		if ( ! moved ) {
			return;
		}

		movedRef.current = undefined;
		// React re-inserts a row it moves, which drops the focus: back to the button that moved it.
		rows[ moved.index ]?.querySelectorAll( 'button' )[ moved.step === -1 ? 0 : 1 ]?.focus();
		animateMove( rows, tabs, moved, reducedMotion );
	}, [ tabs, reducedMotion ] );

	// However the dialog goes away, the order it was trying goes with it.
	useEffect( () => () => onPreview?.(), [ onPreview ] );

	const move = useCallback(
		( index: number, step: Step ) => {
			const next = [ ...tabs ];
			const [ tab ] = next.splice( index, 1 );
			const tops = new Map(
				Array.from(
					listRef.current?.children ?? [],
					( row, position ) =>
						[ tabs[ position ].slug, row.getBoundingClientRect().top ] as [ string, number ]
				)
			);

			next.splice( index + step, 0, tab );
			movedRef.current = { index: index + step, step, tops };
			setTabs( next );
			onPreview?.( next.map( nextTab => nextTab.slug ) );
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
		[ onPreview, tabs ]
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
