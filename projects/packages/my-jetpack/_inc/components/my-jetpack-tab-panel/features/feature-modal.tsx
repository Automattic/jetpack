import { useViewportMatch } from '@wordpress/compose';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { check, chevronLeft, chevronRight } from '@wordpress/icons';
import { Badge, Dialog, IconButton, Stack, Text } from '@wordpress/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getActivationStatusLabel } from '../utils';
import { getArrowStep } from './arrow-navigation';
import { getBandStyle } from './band-palette';
import { FeatureBand } from './feature-band';
import { FeatureDelivery } from './feature-delivery';
import { FeatureHighlights } from './feature-highlights';
import { FeatureIcon } from './feature-icon';
import { FeatureLinks } from './feature-links';
import { FeatureModalActions } from './feature-modal-actions';
import { FeaturePaid } from './feature-paid';
import styles from './styles.module.scss';
import type { FeatureState } from './feature-state';
import type { FeatureFilter } from './use-feature-filter';

// Set by @wordpress/ui on the dialog's own close button.
const CLOSE_ICON_ATTR = 'data-wp-ui-dialog-close-icon';

type FeatureNeighbor = { slug: string; name: string };

type StepButtonProps = {
	direction: 'previous' | 'next';
	neighbor?: FeatureNeighbor;
	rtl: boolean;
	onStep: ( slug: string ) => void;
};

/**
 * A footer button that steps to a neighboring feature, naming it and the arrow key that does the same.
 *
 * @param {StepButtonProps} props           - The component props.
 * @param {string}          props.direction - Which way the button steps.
 * @param {FeatureNeighbor} props.neighbor  - The feature it steps to, if any.
 * @param {boolean}         props.rtl       - Whether the locale reads right to left.
 * @param {Function}        props.onStep    - Switches the modal to another feature.
 * @return The rendered component.
 */
function StepButton( { direction, neighbor, rtl, onStep }: StepButtonProps ) {
	const isLeft = ( direction === 'previous' ) !== rtl;
	const onClick = useCallback( () => neighbor && onStep( neighbor.slug ), [ neighbor, onStep ] );

	let label: string;
	if ( neighbor ) {
		label =
			direction === 'previous'
				? sprintf(
						/* translators: %s is a feature name, such as "Stats". */
						__( 'Previous: %s', 'jetpack-my-jetpack' ),
						neighbor.name
					)
				: sprintf(
						/* translators: %s is a feature name, such as "Stats". */
						__( 'Next: %s', 'jetpack-my-jetpack' ),
						neighbor.name
					);
	} else {
		label =
			direction === 'previous'
				? __( 'Previous feature', 'jetpack-my-jetpack' )
				: __( 'Next feature', 'jetpack-my-jetpack' );
	}

	return (
		<IconButton
			icon={ isLeft ? chevronLeft : chevronRight }
			label={ label }
			shortcut={ {
				displayShortcut: isLeft ? '←' : '→',
				ariaKeyShortcut: isLeft ? 'ArrowLeft' : 'ArrowRight',
				label: isLeft
					? __( 'Left arrow', 'jetpack-my-jetpack' )
					: __( 'Right arrow', 'jetpack-my-jetpack' ),
			} }
			variant="minimal"
			tone="neutral"
			size="small"
			disabled={ ! neighbor }
			focusableWhenDisabled
			onClick={ onClick }
		/>
	);
}

type FeatureModalProps = {
	state: FeatureState;
	previous?: FeatureNeighbor;
	next?: FeatureNeighbor;
	position: number;
	total: number;
	onStep: ( slug: string ) => void;
	onClose: () => void;
	onFilterByPlan: ( plan: FeatureFilter ) => void;
};

/**
 * The feature's details, shown over the grid rather than on a page of its own.
 *
 * @param {FeatureModalProps} props                - The component props.
 * @param {FeatureState}      props.state          - Live state for the feature being shown.
 * @param {FeatureNeighbor}   props.previous       - The preceding shown feature, if any.
 * @param {FeatureNeighbor}   props.next           - The following shown feature, if any.
 * @param {number}            props.position       - This feature's 1-based place among those shown, 0 when hidden.
 * @param {number}            props.total          - How many features are shown.
 * @param {Function}          props.onStep         - Switches the modal to another feature.
 * @param {Function}          props.onClose        - Closes the modal.
 * @param {Function}          props.onFilterByPlan - Filters the grid to one plan.
 * @return The rendered component.
 */
export function FeatureModal( {
	state,
	previous,
	next,
	position,
	total,
	onStep,
	onClose,
	onFilterByPlan,
}: FeatureModalProps ) {
	const { feature, product } = state;
	const isActive = state.status === 'active';
	const freeHighlights = feature.free_highlights ?? [];

	const onOpenChange = useCallback(
		( open: boolean ) => {
			if ( ! open ) {
				onClose();
			}
		},
		[ onClose ]
	);

	const popupRef = useRef< HTMLDivElement | null >( null );
	// Also held in state: the portal mounts the popup after the first effects run.
	const [ popupNode, setPopupNode ] = useState< HTMLDivElement | null >( null );
	const setPopupRef = useCallback( ( node: HTMLDivElement | null ) => {
		popupRef.current = node;
		setPopupNode( node );
	}, [] );
	const claimedRef = useRef< string | null >( null );
	// The feature an arrow-key step went to, whose action then takes focus wherever it was.
	const steppedToRef = useRef< string | null >( null );

	// The header's action, which is what the modal is open in order to reach — not the
	// first link in the body.
	const findAction = useCallback( () => {
		const actions = popupRef.current?.querySelector( '[data-feature-actions]' );

		return Array.from( actions?.querySelectorAll< HTMLElement >( 'button, a[href]' ) ?? [] ).find(
			element =>
				! element.hasAttribute( 'disabled' ) && element.getAttribute( 'aria-disabled' ) !== 'true'
		);
	}, [] );

	const initialFocus = useCallback( () => findAction() ?? true, [ findAction ] );

	// A product's action only renders once its state arrives, which is usually after the
	// dialog opened and resolved its own focus. Claim focus the first time the action
	// exists for this feature, and only while focus is still where the dialog put it.
	useEffect( () => {
		const popup = popupRef.current;
		const active = popup?.ownerDocument.activeElement;

		if (
			claimedRef.current === feature.slug ||
			! popup ||
			! active ||
			( steppedToRef.current !== feature.slug &&
				active !== popup &&
				! active.hasAttribute( CLOSE_ICON_ATTR ) )
		) {
			return;
		}

		const action = findAction();

		if ( action ) {
			claimedRef.current = feature.slug;
			steppedToRef.current = null;
			action.focus();
		}
	}, [ feature.slug, findAction, state ] );

	const rtl = isRTL();

	useEffect( () => {
		const onKeyDown = ( event: KeyboardEvent ) => {
			const step = getArrowStep( event, rtl );

			if ( ! step ) {
				return;
			}

			event.preventDefault();
			const target = step === 'previous' ? previous : next;

			if ( target ) {
				steppedToRef.current = target.slug;
				onStep( target.slug );
			}
		};

		// Capture phase: the dialog stops keydown propagating, so bubbling never reaches us.
		popupNode?.addEventListener( 'keydown', onKeyDown, true );
		return () => popupNode?.removeEventListener( 'keydown', onKeyDown, true );
	}, [ next, onStep, popupNode, previous, rtl ] );

	// Only a centered dialog has room for a pinned footer; the phone sheet keeps its links in the body.
	const isDesktop = useViewportMatch( 'small' );

	return (
		<Dialog.Root open onOpenChange={ onOpenChange }>
			<Dialog.Popup
				ref={ setPopupRef }
				size="stretch"
				className={ styles[ 'modal-popup' ] }
				portal={ <Dialog.Portal className={ styles[ 'modal-portal' ] } /> }
				initialFocus={ initialFocus }
			>
				{ /* Close renders before the artwork so a keyboard user reaches it in one Tab. */ }
				<div className={ styles[ 'modal-band' ] } style={ getBandStyle( feature.slug ) }>
					<Dialog.CloseIcon className={ styles[ 'modal-band__close' ] } />
					<div className={ styles[ 'modal-band__art' ] }>
						<FeatureBand feature={ feature } />
					</div>
				</div>

				<Dialog.Header className={ styles[ 'modal-header' ] }>
					<span className={ styles[ 'modal-icon' ] } aria-hidden="true">
						<FeatureIcon feature={ feature } />
					</span>
					<div className={ styles[ 'modal-header__main' ] }>
						<Stack direction="column" gap="xs" className={ styles[ 'modal-heading' ] }>
							<Dialog.Title>{ feature.name }</Dialog.Title>
							<Stack direction="row" align="center" gap="sm" wrap="wrap">
								<Badge intent={ isActive ? 'stable' : 'draft' }>
									{ getActivationStatusLabel( isActive ) }
								</Badge>
								{ feature.essential ? (
									<Badge intent="informational">{ __( 'Essential', 'jetpack-my-jetpack' ) }</Badge>
								) : null }
							</Stack>
						</Stack>

						<Stack
							direction="row"
							align="center"
							gap="sm"
							className={ styles[ 'modal-actions' ] }
							data-feature-actions
						>
							<FeatureModalActions state={ state } />
						</Stack>
					</div>
				</Dialog.Header>

				<Dialog.Content className={ styles[ 'modal-body' ] }>
					<p className="screen-reader-text" role="status">
						{ position > 0
							? sprintf(
									/* translators: 1: a feature name, 2: its place in the list, 3: how many are listed. */
									__( '%1$s, %2$d of %3$d', 'jetpack-my-jetpack' ),
									feature.name,
									position,
									total
								)
							: feature.name }
					</p>

					<FeatureDelivery state={ state } />

					<Dialog.Description>
						{ feature.long_description || product?.longDescription || feature.description }
					</Dialog.Description>

					<div className={ styles[ 'modal-panels' ] }>
						{ freeHighlights.length > 0 && (
							<section className={ styles[ 'detail-section' ] }>
								<Text variant="heading-sm" render={ <h3 /> }>
									{ __( 'Free', 'jetpack-my-jetpack' ) }
								</Text>
								<FeatureHighlights items={ freeHighlights } icon={ check } />
							</section>
						) }

						<FeaturePaid state={ state } onFilterByPlan={ onFilterByPlan } />
					</div>

					{ ! isDesktop && <FeatureLinks feature={ feature } /> }
				</Dialog.Content>

				{ isDesktop && (
					<Dialog.Footer className={ styles[ 'modal-footer' ] }>
						<FeatureLinks feature={ feature } />
						<Stack direction="row" gap="xs" className={ styles[ 'modal-steps' ] }>
							<StepButton
								direction="previous"
								neighbor={ previous }
								rtl={ rtl }
								onStep={ onStep }
							/>
							<StepButton direction="next" neighbor={ next } rtl={ rtl } onStep={ onStep } />
						</Stack>
					</Dialog.Footer>
				) }
			</Dialog.Popup>
		</Dialog.Root>
	);
}
