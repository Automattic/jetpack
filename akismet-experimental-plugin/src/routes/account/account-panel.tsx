import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardBody, CardHeader, Notice, Spinner } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { akismetKeys } from '@/data/query-keys';
import { useApiKey } from '@/hooks/use-api-key';
import { apiClient, type WpError } from '@/lib/api-client';
import { allowMutations } from '@/lib/is-jetpack-active';
import type { ApiKeyState } from '@/lib/types';

const PREVIEW_MODE_CODE = 'preview_mode_active';

/**
 * Render a key with only the leading characters visible. Cheap masking; the
 * key isn't a secret on its own (a user with `manage_options` can read it
 * directly via the REST endpoint) but the UI shouldn't shoulder-surf it.
 *
 * @param key - The full key.
 * @return Masked representation.
 */
function maskKey( key: string ): string {
	if ( key.length <= 4 ) {
		return key;
	}
	return `${ key.slice( 0, 4 ) }${ '•'.repeat( key.length - 4 ) }`;
}

/**
 * The connected-state UI for the Account tab. Shows the masked key + a
 * "Disconnect" button (gated by `AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS`,
 * per Option A).
 *
 * @return The rendered panel.
 */
export function AccountPanel(): JSX.Element {
	const queryClient = useQueryClient();
	const { data, isLoading } = useApiKey();
	const [ previewNotice, setPreviewNotice ] = useState< string | null >( null );

	const disconnect = useMutation< { success: true }, WpError, void >( {
		mutationFn: async () => {
			if ( ! allowMutations() ) {
				throw {
					code: PREVIEW_MODE_CODE,
					message: __( 'Preview mode — disconnect disabled.', 'akismet' ),
					data: { status: 403 },
				} satisfies WpError;
			}
			return apiClient.delete< { success: true } >( 'key' );
		},
		onSuccess: () => {
			queryClient.setQueryData< ApiKeyState >( akismetKeys.key(), {
				key: '',
				valid: false,
			} );
		},
		onError: err => {
			if ( err?.code === PREVIEW_MODE_CODE ) {
				setPreviewNotice( err.message );
			}
		},
	} );

	if ( isLoading ) {
		return <Spinner />;
	}

	if ( ! data?.valid ) {
		return (
			<Notice status="warning" isDismissible={ false }>
				{ __( 'No active key on this site.', 'akismet' ) }
			</Notice>
		);
	}

	return (
		<Card>
			<CardHeader>{ __( 'Akismet account', 'akismet' ) }</CardHeader>
			<CardBody>
				<p>
					{ sprintf(
						/* translators: %s: the masked API key. */
						__( 'API key: %s', 'akismet' ),
						maskKey( data.key )
					) }
				</p>
				{ previewNotice && (
					<Notice status="warning" isDismissible={ false }>
						{ previewNotice }
					</Notice>
				) }
				<Button
					variant="secondary"
					isDestructive
					onClick={ () => {
						setPreviewNotice( null );
						disconnect.mutate();
					} }
					isBusy={ disconnect.isPending }
					disabled={ disconnect.isPending }
					__next40pxDefaultSize
				>
					{ __( 'Disconnect this key', 'akismet' ) }
				</Button>
			</CardBody>
		</Card>
	);
}
