import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Notice } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { akismetKeys } from '@/data/query-keys';
import { apiClient, type WpError } from '@/lib/api-client';
import { isJetpackActive } from '@/lib/is-jetpack-active';
import type { ApiKeyState } from '@/lib/types';

/**
 * Props for `<ConnectJetpackStep>` — fired after a successful key fetch.
 */
type Props = {
	onSuccess: () => void;
};

/**
 * "Connect with Jetpack" button. Wraps `GET /akismet/v1/jetpack-key`, which
 * pulls the Jetpack-connected user's Akismet key on the server and writes it
 * to `wordpress_api_key` (gated by `AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS`).
 *
 * The button renders nothing when Jetpack is not active — the parent
 * `<ConnectFlow>` only routes to this step when Jetpack IS active, but
 * defending against direct mount keeps the failure mode visible (empty UI
 * is better than a "this can't possibly work" button).
 *
 * @param props           - The component props.
 * @param props.onSuccess
 * @return The rendered button + status notices, or null when Jetpack is off.
 */
export function ConnectJetpackStep( props: Props ): JSX.Element | null {
	// `isJetpackActive()` reads from the PHP-localized global — it never
	// changes at runtime. Short-circuit at the parent so the inner component
	// (which uses hooks) doesn't mount at all when Jetpack is off. This also
	// keeps the early return outside the hook scope, which keeps
	// `@wordpress/no-unused-vars-before-return` happy.
	if ( ! isJetpackActive() ) {
		return null;
	}
	return <ConnectJetpackStepInner { ...props } />;
}

/**
 * Inner implementation — mounted only when Jetpack is active. Owns the
 * `useState` / `useMutation` calls.
 *
 * @param props           - Forwarded from the parent.
 * @param props.onSuccess - Called after a successful key fetch.
 * @return The button + status notices.
 */
function ConnectJetpackStepInner( { onSuccess }: Props ): JSX.Element {
	const queryClient = useQueryClient();
	const [ error, setError ] = useState< string | null >( null );
	const [ success, setSuccess ] = useState( false );

	const mutation = useMutation< ApiKeyState, WpError, void >( {
		mutationFn: () => apiClient.get< ApiKeyState >( 'jetpack-key' ),
		onSuccess: data => {
			queryClient.setQueryData( akismetKeys.key(), data );
			setSuccess( true );
			onSuccess();
		},
		onError: err => {
			setError( err?.message ?? __( 'Could not connect with Jetpack.', 'akismet' ) );
		},
	} );

	return (
		<div className="akismet-connect-jetpack">
			<Button
				variant="primary"
				onClick={ () => {
					setError( null );
					setSuccess( false );
					mutation.mutate();
				} }
				isBusy={ mutation.isPending }
				disabled={ mutation.isPending }
				__next40pxDefaultSize
			>
				{ __( 'Connect with Jetpack', 'akismet' ) }
			</Button>
			{ error && (
				<Notice status="error" isDismissible={ false }>
					{ error }
				</Notice>
			) }
			{ success && (
				<Notice status="success" isDismissible={ false }>
					{ __( 'Jetpack key connected.', 'akismet' ) }
				</Notice>
			) }
		</div>
	);
}
