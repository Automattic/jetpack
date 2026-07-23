import { ThemeProvider } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronLeft } from '@wordpress/icons';
import { Dialog, IconButton, Text, Tooltip } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
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
 * Step router: maps the current connection-flow step to its content. Every step
 * renders a placeholder for now; M2-01…04 slot their components in here.
 *
 * @param step - The current flow step.
 * @return The step content.
 */
function renderStep( step: ConnectionFlowStep ): JSX.Element {
	switch ( step ) {
		case 'select-platform':
		case 'platform-input':
		case 'authorizing':
		case 'confirm':
		case 'creating':
			return <StepPlaceholder step={ step } />;
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
	const { step, canGoBack } = useSelect( select => {
		const { getConnectionFlowStep, canGoToPreviousConnectionFlowStep } = select( socialStore );
		return {
			step: getConnectionFlowStep(),
			canGoBack: canGoToPreviousConnectionFlowStep(),
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
								icon={ chevronLeft }
								label={ __( 'Back', 'jetpack-publicize-pkg' ) }
								onClick={ goToPreviousStep }
							/>
						) }
						<Dialog.Title>{ __( 'Add an account', 'jetpack-publicize-pkg' ) }</Dialog.Title>
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
