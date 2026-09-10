import { __, isRTL, sprintf } from '@wordpress/i18n';
import { check, chevronLeft, chevronRight } from '@wordpress/icons';
import { Badge, Button, Dialog, Icon, LinkButton, Stack, Text } from '@wordpress/ui';
import { useCallback, useEffect, useRef } from 'react';
import { getArrowStep } from './arrow-navigation';
import { FeatureIcon } from './feature-icon';
import { FeatureLinks } from './feature-links';
import { FeatureScreenshot } from './feature-screenshot';
import { FeatureSwitch } from './feature-switch';
import styles from './styles.module.scss';
import type { FeatureState } from './feature-state';

// Set by @wordpress/ui on the dialog's own close button.
const CLOSE_ICON_ATTR = 'data-wp-ui-dialog-close-icon';

type FeatureModalProps = {
	state: FeatureState;
	previous?: FeatureState;
	next?: FeatureState;
	onClose: () => void;
	onStep: ( slug: string ) => void;
};

/**
 * The feature's details, shown over the list rather than on a page of its own.
 *
 * @param {FeatureModalProps} props          - The component props.
 * @param {FeatureState}      props.state    - Live state for the feature being shown.
 * @param {FeatureState}      props.previous - The preceding feature, if any.
 * @param {FeatureState}      props.next     - The following feature, if any.
 * @param {Function}          props.onClose  - Closes the modal.
 * @param {Function}          props.onStep   - Switches the modal to another feature.
 * @return The rendered component.
 */
export function FeatureModal( { state, previous, next, onClose, onStep }: FeatureModalProps ) {
	const { feature, product } = state;
	const isActive = state.status === 'active';
	const highlights = product?.features ?? [];
	const backwards = isRTL() ? chevronRight : chevronLeft;
	const forwards = isRTL() ? chevronLeft : chevronRight;

	const onOpenChange = useCallback(
		( open: boolean ) => {
			if ( ! open ) {
				onClose();
			}
		},
		[ onClose ]
	);

	const onPrevious = useCallback(
		() => previous && onStep( previous.feature.slug ),
		[ onStep, previous ]
	);
	const onNext = useCallback( () => next && onStep( next.feature.slug ), [ next, onStep ] );
	const popupRef = useRef< HTMLDivElement >( null );
	const claimedRef = useRef< string | null >( null );

	useEffect( () => {
		const onKeyDown = ( event: KeyboardEvent ) => {
			const step = getArrowStep( event, isRTL() );

			if ( ! step ) {
				return;
			}

			event.preventDefault();
			( step === 'previous' ? onPrevious : onNext )();
		};

		// Capture phase: the dialog stops keydown propagating, so bubbling never reaches us.
		document.addEventListener( 'keydown', onKeyDown, true );
		return () => document.removeEventListener( 'keydown', onKeyDown, true );
	}, [ onNext, onPrevious ] );

	// The footer's action, which is what the modal is open in order to reach — not the
	// first link in the body, and not the step buttons.
	const findAction = useCallback( () => {
		const footer = popupRef.current?.querySelector( 'footer' );
		const steps = footer?.querySelector( `.${ styles[ 'modal-steps' ] }` );

		return Array.from( footer?.querySelectorAll< HTMLElement >( 'button, a[href]' ) ?? [] ).find(
			element =>
				! steps?.contains( element ) &&
				! element.hasAttribute( 'disabled' ) &&
				element.getAttribute( 'aria-disabled' ) !== 'true'
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
			( active !== popup && ! active.hasAttribute( CLOSE_ICON_ATTR ) )
		) {
			return;
		}

		const action = findAction();

		if ( action ) {
			claimedRef.current = feature.slug;
			action.focus();
		}
	}, [ feature.slug, findAction, state ] );

	return (
		<Dialog.Root open onOpenChange={ onOpenChange }>
			<Dialog.Popup
				ref={ popupRef }
				size="large"
				className={ styles[ 'modal-popup' ] }
				initialFocus={ initialFocus }
			>
				<Dialog.Header>
					<Stack direction="row" align="center" gap="md">
						<FeatureIcon feature={ feature } />
						<Stack direction="column" gap="xs">
							<Dialog.Title>{ feature.name }</Dialog.Title>
							<Stack direction="row" align="center" gap="sm" wrap="wrap">
								<Badge intent={ isActive ? 'stable' : 'none' }>
									{ isActive
										? __( 'Active', 'jetpack-my-jetpack' )
										: __( 'Inactive', 'jetpack-my-jetpack' ) }
								</Badge>
								{ feature.essential ? (
									<Badge intent="informational">{ __( 'Essential', 'jetpack-my-jetpack' ) }</Badge>
								) : null }
							</Stack>
						</Stack>
					</Stack>
					<Dialog.CloseIcon />
				</Dialog.Header>

				<Dialog.Content>
					<div className={ styles[ 'modal-body' ] }>
						<Stack direction="column" gap="lg">
							<Dialog.Description>
								{ product?.longDescription || feature.description }
							</Dialog.Description>

							{ highlights.length > 0 && (
								<div className={ styles[ 'detail-highlights' ] }>
									<Text variant="heading-md">{ __( 'What you get', 'jetpack-my-jetpack' ) }</Text>
									<Stack direction="column" gap="sm">
										{ highlights.map( highlight => (
											<Stack key={ highlight } direction="row" align="start" gap="sm">
												<Icon icon={ check } size={ 20 } />
												<Text variant="body-md">{ highlight }</Text>
											</Stack>
										) ) }
									</Stack>
								</div>
							) }

							<FeatureLinks feature={ feature } isActive={ isActive } />
						</Stack>

						<FeatureScreenshot feature={ feature } />
					</div>
				</Dialog.Content>

				<Dialog.Footer>
					<Stack direction="row" align="center" gap="sm" className={ styles[ 'modal-steps' ] }>
						{ /* Icon only, and always rendered: naming it too made its width vary
						     with the feature, which shifted the next button on every step. */ }
						<Button
							variant="minimal"
							tone="neutral"
							size="compact"
							onClick={ onPrevious }
							disabled={ ! previous }
							aria-label={
								previous
									? sprintf(
											/* translators: %s is the feature name. */
											__( 'Previous feature: %s', 'jetpack-my-jetpack' ),
											previous.feature.name
									  )
									: __( 'Previous feature', 'jetpack-my-jetpack' )
							}
						>
							<Icon icon={ backwards } size={ 20 } />
						</Button>
						{ next ? (
							<Button
								variant="minimal"
								tone="neutral"
								size="compact"
								onClick={ onNext }
								aria-label={ sprintf(
									/* translators: %s is the feature name. */
									__( 'Next feature: %s', 'jetpack-my-jetpack' ),
									next.feature.name
								) }
							>
								<Stack direction="row" align="center" gap="xs">
									{ next.feature.name }
									<Icon icon={ forwards } size={ 20 } />
								</Stack>
							</Button>
						) : null }
					</Stack>

					{ isActive && feature.manage_url ? (
						<LinkButton href={ feature.manage_url } variant="solid">
							{ __( 'Open', 'jetpack-my-jetpack' ) }
						</LinkButton>
					) : null }
					<FeatureSwitch state={ state } />
					{ /* The upsell stays a deliberate second step, never the destination. */ }
					{ state.action === 'learn_more' && feature.learn_more_route ? (
						<LinkButton href={ `#${ feature.learn_more_route }` } variant="outline" tone="neutral">
							{ __( 'See plans and pricing', 'jetpack-my-jetpack' ) }
						</LinkButton>
					) : null }
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
