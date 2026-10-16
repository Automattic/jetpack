import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { store } from '../../social-store';
import { validateConnectInputs } from './connect-input-validation';
import type {
	ConnectInputValidation,
	ConnectInputValues,
	ValidateConnectInputsOptions,
} from './connect-input-validation';

/**
 * Wires {@link validateConnectInputs} to the store's already-connected checks.
 *
 * @return A function validating a service's inputs.
 */
export function useConnectInputValidation() {
	const { isMastodonAccountAlreadyConnected, isBlueskyAccountAlreadyConnected } = useSelect(
		select => {
			const selectors = select( store );

			return {
				isMastodonAccountAlreadyConnected: selectors.isMastodonAccountAlreadyConnected,
				isBlueskyAccountAlreadyConnected: selectors.isBlueskyAccountAlreadyConnected,
			};
		},
		[]
	);

	return useCallback(
		(
			serviceId: string,
			values: ConnectInputValues,
			options: Pick< ValidateConnectInputsOptions, 'allowDuplicate' > = {}
		): ConnectInputValidation => {
			let isAlreadyConnected: ValidateConnectInputsOptions[ 'isAlreadyConnected' ];

			if ( 'mastodon' === serviceId ) {
				isAlreadyConnected = isMastodonAccountAlreadyConnected;
			} else if ( 'bluesky' === serviceId ) {
				isAlreadyConnected = isBlueskyAccountAlreadyConnected;
			}

			return validateConnectInputs( serviceId, values, { ...options, isAlreadyConnected } );
		},
		[ isBlueskyAccountAlreadyConnected, isMastodonAccountAlreadyConnected ]
	);
}
