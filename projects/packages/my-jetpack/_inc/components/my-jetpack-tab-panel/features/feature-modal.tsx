import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';
import { Badge, Dialog, Icon, Stack, Text } from '@wordpress/ui';
import { useCallback, useEffect, useRef } from 'react';
import { getActivationStatusLabel } from '../utils';
import { FeatureBand } from './feature-band';
import { FeatureDelivery } from './feature-delivery';
import { FeatureIcon } from './feature-icon';
import { FeatureInstallNotice } from './feature-install-notice';
import { FeatureLinks } from './feature-links';
import { FeatureModalActions } from './feature-modal-actions';
import { FeaturePaid } from './feature-paid';
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
 * The feature's details, shown over the grid rather than on a page of its own.
 *
 * @param {FeatureModalProps} props                - The component props.
 * @param {FeatureState}      props.state          - Live state for the feature being shown.
 * @param {Function}          props.onClose        - Closes the modal.
 * @param {Function}          props.onFilterByPlan - Filters the grid to one plan.
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
	// first link in the body.
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
					<div className={ styles[ 'modal-step' ] }>
						<FeatureBand feature={ feature } />
					</div>
				</div>

				<Dialog.Content className={ styles[ 'modal-body' ] }>
					<div className={ styles[ 'modal-step' ] }>
						<Stack direction="row" align="start" gap="md" wrap="wrap">
							<span className={ styles[ 'modal-icon' ] } aria-hidden="true">
								<FeatureIcon feature={ feature } />
							</span>
							<Stack direction="column" gap="xs">
								<Dialog.Title>{ feature.name }</Dialog.Title>
								<Stack direction="row" align="center" gap="sm" wrap="wrap">
									<Badge intent={ isActive ? 'stable' : 'none' }>
										{ getActivationStatusLabel( isActive ) }
									</Badge>
									{ feature.essential ? (
										<Badge intent="informational">
											{ __( 'Essential', 'jetpack-my-jetpack' ) }
										</Badge>
									) : null }
								</Stack>
							</Stack>

							{ /* Beside the name rather than in a footer: the switch and the way in
							     are what the modal is open for, so they sit with what they act on. */ }
							<Stack
								direction="row"
								align="center"
								gap="sm"
								className={ styles[ 'modal-actions' ] }
							>
								<FeatureModalActions state={ state } />
							</Stack>
						</Stack>

						<Dialog.Description>
							{ feature.long_description || product?.longDescription || feature.description }
						</Dialog.Description>

						<FeatureInstallNotice state={ state } />

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

						<FeatureLinks feature={ feature } />
					</div>
				</Dialog.Content>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
