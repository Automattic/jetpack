import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';
import { Badge, Dialog, Icon, LinkButton, Stack, Text } from '@wordpress/ui';
import { useCallback, useEffect, useRef } from 'react';
import { FeatureBand } from './feature-band';
import { FeatureDelivery } from './feature-delivery';
import { FeatureIcon } from './feature-icon';
import { FeatureLinks } from './feature-links';
import { FeaturePaid } from './feature-paid';
import { featureStatusLabel } from './feature-status-label';
import { FeatureSwitch } from './feature-switch';
import styles from './styles.module.scss';
import type { FeatureState } from './feature-state';
import type { FeatureFilter } from './use-feature-filter';

// Set by @wordpress/ui on the dialog's own close button.
const CLOSE_ICON_ATTR = 'data-wp-ui-dialog-close-icon';

type FeatureModalProps = {
	state: FeatureState;
	onClose: () => void;
	onFilterByPlan: ( plan: FeatureFilter ) => void;
};

/**
 * The feature's details, shown over the list rather than on a page of its own.
 *
 * @param {FeatureModalProps} props                - The component props.
 * @param {FeatureState}      props.state          - Live state for the feature being shown.
 * @param {Function}          props.onClose        - Closes the modal.
 * @param {Function}          props.onFilterByPlan - Filters the list to one plan.
 * @return The rendered component.
 */
export function FeatureModal( { state, onClose, onFilterByPlan }: FeatureModalProps ) {
	const { feature, product } = state;
	const isActive = state.status === 'active';
	const highlights = product?.features ?? [];

	const onOpenChange = useCallback(
		( open: boolean ) => {
			if ( ! open ) {
				onClose();
			}
		},
		[ onClose ]
	);

	const popupRef = useRef< HTMLDivElement >( null );
	const claimedRef = useRef< string | null >( null );

	// The header's action, which is what the modal is open in order to reach — not the
	// first link in the body, and not the step buttons.
	const findAction = useCallback( () => {
		const actions = popupRef.current?.querySelector( `.${ styles[ 'modal-actions' ] }` );

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
				size="stretch"
				className={ styles[ 'modal-popup' ] }
				initialFocus={ initialFocus }
			>
				{ /* Full-bleed, so it sits outside Dialog.Content's padding. Close renders
				     before the artwork so a keyboard user reaches it in one Tab. */ }
				<div className={ styles[ 'modal-band' ] }>
					<Dialog.CloseIcon className={ styles[ 'modal-band__close' ] } />
					<div key={ feature.slug } className={ styles[ 'modal-step' ] }>
						<FeatureBand feature={ feature } />
					</div>
				</div>

				<Dialog.Content className={ styles[ 'modal-body' ] }>
					<div key={ feature.slug } className={ styles[ 'modal-step' ] }>
						<Stack direction="row" align="center" gap="md" className={ styles[ 'modal-identity' ] }>
							<FeatureIcon feature={ feature } />
							<Stack direction="column" gap="xs">
								<Dialog.Title>{ feature.name }</Dialog.Title>
								<Stack direction="row" align="center" gap="sm" wrap="wrap">
									<Badge intent={ isActive ? 'stable' : 'none' }>
										{ featureStatusLabel( isActive ) }
									</Badge>
									{ feature.essential ? (
										<Badge intent="informational">
											{ __( 'Essential', 'jetpack-my-jetpack' ) }
										</Badge>
									) : null }
								</Stack>
							</Stack>

							{ /* Beside the name rather than in the footer: the switch and the way in
							     are what the modal is open for, so they sit with what they act on. */ }
							<Stack
								direction="row"
								align="center"
								gap="sm"
								className={ styles[ 'modal-actions' ] }
							>
								{ isActive && feature.manage_url ? (
									<LinkButton href={ feature.manage_url } variant="solid">
										{ __( 'Open', 'jetpack-my-jetpack' ) }
									</LinkButton>
								) : null }
								<FeatureSwitch state={ state } />
								{ /* The upsell stays a deliberate second step, never the destination. */ }
								{ state.action === 'learn_more' && feature.learn_more_route ? (
									<LinkButton
										href={ `#${ feature.learn_more_route }` }
										variant="outline"
										tone="neutral"
									>
										{ __( 'See plans and pricing', 'jetpack-my-jetpack' ) }
									</LinkButton>
								) : null }
							</Stack>
						</Stack>

						<Dialog.Description>
							{ feature.long_description || product?.longDescription || feature.description }
						</Dialog.Description>

						{ /* auto-fit rather than three fixed tracks: a section that renders
						     nothing would otherwise leave a dead column behind it. */ }
						<div className={ styles[ 'modal-panels' ] }>
							{ highlights.length > 0 && (
								<section className={ styles[ 'detail-section' ] }>
									<Text variant="heading-sm" render={ <h3 /> }>
										{ __( 'What you get', 'jetpack-my-jetpack' ) }
									</Text>
									<Stack direction="column" gap="sm">
										{ highlights.map( highlight => (
											<Stack key={ highlight } direction="row" align="start" gap="sm">
												<Icon icon={ check } size={ 20 } />
												<Text variant="body-md">{ highlight }</Text>
											</Stack>
										) ) }
									</Stack>
								</section>
							) }

							<FeatureDelivery state={ state } />
							<FeaturePaid state={ state } onFilterByPlan={ onFilterByPlan } />
						</div>

						<FeatureLinks feature={ feature } isActive={ isActive } />
					</div>
				</Dialog.Content>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
