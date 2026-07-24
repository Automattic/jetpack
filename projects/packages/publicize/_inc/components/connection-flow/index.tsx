import { ThemeProvider } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { Dialog, IconButton, Text, Tooltip } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
import { SelectPlatform } from './select-platform';
import type { ConnectionFlowStep } from '../../social-store/types';

/**
 * Placeholder body shown until a step's own component lands. Each of M2-01…04
 * replaces its branch in `renderStep` with the real step UI.
 *
 * @param props      - Props.
 * @param props.step - The step being rendered.
 * @return The placeholder body.
 */
const StepPlaceholder = ( { step }: { step: ConnectionFlowStep } ) => (
	<Text variant="body-sm" render={ <p /> }>
		{ step }
	</Text>
);

/**
 * Step router: maps the current connection-flow step to its content.
 *
 * @param step - The current flow step.
 * @return The step content.
 */
function renderStep( step: ConnectionFlowStep ): JSX.Element {
	switch ( step ) {
		case 'select-platform':
			return <SelectPlatform />;
		case 'platform-input':
		case 'authorizing':
		case 'confirm':
		case 'creating':
			return <StepPlaceholder step={ step } />;
	}
}

/**
 * The dialog title for the current step. `platform-input` names the chosen
 * platform; the other steps use a static title.
 *
 * @param step         - The current flow step.
 * @param serviceLabel - Label of the selected service, for `platform-input`.
 * @return The dialog title.
 */
function getStepTitle( step: ConnectionFlowStep, serviceLabel: string ): string {
	switch ( step ) {
		case 'select-platform':
			return __( 'Select your account platform', 'jetpack-publicize-pkg' );
		case 'platform-input':
			return sprintf(
				// translators: %s is the platform name, e.g. "Mastodon".
				__( 'Connect %s account', 'jetpack-publicize-pkg' ),
				serviceLabel
			);
		default:
			return __( 'Add an account', 'jetpack-publicize-pkg' );
	}
}

/**
 * The open connection-flow dialog. Only rendered while the flow is active, so
 * the controlled `open` prop stays `true` and any close intent (Esc, backdrop,
 * close button) routes through `onOpenChange` to reset the flow.
 *
 * @return The dialog.
 */
const ConnectionFlowDialog = () => {
	const { step, canGoBack, serviceLabel } = useSelect( select => {
		const {
			getConnectionFlowStep,
			canGoToPreviousConnectionFlowStep,
			getConnectionFlowSelectedServiceId,
			getService,
		} = select( socialStore );
		const serviceId = getConnectionFlowSelectedServiceId();
		return {
			step: getConnectionFlowStep(),
			canGoBack: canGoToPreviousConnectionFlowStep(),
			serviceLabel: serviceId ? getService( serviceId )?.label ?? '' : '',
		};
	}, [] );

	const { cancelConnectionFlow, goToPreviousStep } = useDispatch( socialStore );

	const onOpenChange = useCallback(
		( open: boolean ) => {
			if ( ! open ) {
				cancelConnectionFlow();
			}
		},
		[ cancelConnectionFlow ]
	);

	if ( ! step ) {
		return null;
	}

	return (
		<Tooltip.Provider delay={ 0 }>
			<Dialog.Root open onOpenChange={ onOpenChange }>
				<Dialog.Popup size="medium">
					<Dialog.Header>
						{ canGoBack && (
							<IconButton
								variant="minimal"
								tone="neutral"
								size="small"
								icon={ isRTL() ? chevronRight : chevronLeft }
								label={ __( 'Back', 'jetpack-publicize-pkg' ) }
								onClick={ goToPreviousStep }
							/>
						) }
						<Dialog.Title>{ getStepTitle( step, serviceLabel ) }</Dialog.Title>
						<Dialog.CloseIcon />
					</Dialog.Header>
					<Dialog.Content>{ renderStep( step ) }</Dialog.Content>
				</Dialog.Popup>
			</Dialog.Root>
		</Tooltip.Provider>
	);
};

/**
 * Container for the redesigned add-account flow. Mirrors `ThemedConnectionsModal`:
 * it self-gates on the store's flow state and portals into `document.body` under
 * its own theme, so mount sites can render it unconditionally. Callers open it by
 * dispatching `startConnectionFlow`.
 *
 * @return The themed connection-flow modal.
 */
export function ConnectionFlowModal() {
	const isActive = useSelect( select => select( socialStore ).isConnectionFlowActive(), [] );

	return (
		<ThemeProvider targetDom={ document.body }>
			{ isActive ? <ConnectionFlowDialog /> : null }
		</ThemeProvider>
	);
}
