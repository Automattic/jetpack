import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Notice, TextControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { akismetKeys } from '@/data/query-keys';
import { apiClient, type WpError } from '@/lib/api-client';
import { allowMutations } from '@/lib/is-jetpack-active';
import type { ApiKeyState } from '@/lib/types';

/**
 * Props for `<EnterKeyStep>` — fired when the entered key is successfully
 * accepted. The parent typically transitions to `<AccountPanel>`.
 */
type Props = {
	onSuccess: () => void;
};

const PREVIEW_MODE_CODE = 'preview_mode_active';

/**
 * Single-input form for entering an existing Akismet API key.
 *
 * Mutation is gated by `allowMutations()` (Option A — see Plan 1 §"Open
 * guardrail question"). The visible preview-mode notice mirrors the PHP
 * 403 `preview_mode_active` shape so a manual `wp-config` flip behaves
 * the same whether the JS gate or the PHP gate fires.
 *
 * @param props           - The component props.
 * @param props.onSuccess
 * @return The rendered form.
 */
export function EnterKeyStep( { onSuccess }: Props ): JSX.Element {
	const queryClient = useQueryClient();
	const [ value, setValue ] = useState( '' );
	const [ inlineError, setInlineError ] = useState< string | null >( null );
	const [ previewNotice, setPreviewNotice ] = useState< string | null >( null );
	const [ success, setSuccess ] = useState( false );

	const mutation = useMutation< ApiKeyState, WpError, string >( {
		mutationFn: async key => {
			if ( ! allowMutations() ) {
				throw {
					code: PREVIEW_MODE_CODE,
					message: __( 'Preview mode — saving keys is disabled.', 'akismet' ),
					data: { status: 403 },
				} satisfies WpError;
			}
			return apiClient.post< ApiKeyState >( 'key', { key } );
		},
		onSuccess: data => {
			queryClient.setQueryData( akismetKeys.key(), data );
			setSuccess( true );
			onSuccess();
		},
		onError: err => {
			if ( err?.code === PREVIEW_MODE_CODE ) {
				setPreviewNotice( err.message );
			} else {
				setInlineError( err?.message ?? __( 'Invalid key.', 'akismet' ) );
			}
		},
	} );

	/**
	 * Submit handler — local validation + dispatch into the mutation.
	 *
	 * @param event - The form submit event.
	 */
	function handleSubmit( event: React.FormEvent< HTMLFormElement > ) {
		event.preventDefault();
		setInlineError( null );
		setPreviewNotice( null );
		setSuccess( false );
		const trimmed = value.trim();
		if ( ! trimmed ) {
			setInlineError( __( 'Please enter a key.', 'akismet' ) );
			return;
		}
		mutation.mutate( trimmed );
	}

	return (
		<form onSubmit={ handleSubmit }>
			<TextControl
				label={ __( 'API key', 'akismet' ) }
				value={ value }
				onChange={ setValue }
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/>
			{ inlineError && (
				<Notice status="error" isDismissible={ false }>
					{ inlineError }
				</Notice>
			) }
			{ previewNotice && (
				<Notice status="warning" isDismissible={ false }>
					{ previewNotice }
				</Notice>
			) }
			{ success && (
				<Notice status="success" isDismissible={ false }>
					{ __( 'Key connected.', 'akismet' ) }
				</Notice>
			) }
			<Button
				variant="primary"
				type="submit"
				isBusy={ mutation.isPending }
				disabled={ mutation.isPending }
				__next40pxDefaultSize
			>
				{ __( 'Use this key', 'akismet' ) }
			</Button>
		</form>
	);
}
