import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useRef } from '@wordpress/element';
import { Notice, Stack } from '@wordpress/ui';
import { store } from '../../../social-store';
import { CONNECTION_FLOW_INPUT_SERVICES } from '../../../social-store/constants';
import { ConnectionService } from '../../../types';
import { PlatformGrid } from '../platform-grid';
import { useStartAuthorization } from '../use-start-authorization';

/**
 * The platform picker step of the connection flow.
 *
 * Renders the platform grid as the body of the connection-flow modal's
 * `Dialog.Content` (the modal owns the header/close/back chrome). Services with
 * custom inputs advance to `platform-input`; the rest have no further gesture to
 * open their popup from, so this click opens it and only then moves on.
 *
 * @return The platform picker step.
 */
export function SelectPlatform() {
	const { selectPlatform } = useDispatch( store );

	const error = useSelect( select => select( store ).getConnectionFlowError(), [] );

	const startAuthorization = useStartAuthorization();

	// Opening the popup can await a services refresh, so cards stay live meanwhile.
	const isStarting = useRef( false );

	const onSelect = useCallback(
		async ( serviceId: string ) => {
			/* Ignore every other card while one is opening, including the input
			   services: switching selection now would leave the pending attempt to
			   land on the wrong service. */
			if ( isStarting.current ) {
				return;
			}

			if ( ( CONNECTION_FLOW_INPUT_SERVICES as readonly string[] ).includes( serviceId ) ) {
				selectPlatform( serviceId );

				return;
			}

			isStarting.current = true;

			try {
				if ( await startAuthorization( serviceId as ConnectionService[ 'id' ] ) ) {
					selectPlatform( serviceId );
				}
			} finally {
				isStarting.current = false;
			}
		},
		[ selectPlatform, startAuthorization ]
	);

	return (
		<Stack direction="column" gap="lg">
			{ /* A failed attempt says why in place; there is no error screen. */ }
			{ error && (
				<Notice.Root intent="error">
					<Notice.Description>{ error }</Notice.Description>
				</Notice.Root>
			) }

			<PlatformGrid onSelect={ onSelect } />
		</Stack>
	);
}
