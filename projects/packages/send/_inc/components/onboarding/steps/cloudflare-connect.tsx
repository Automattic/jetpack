import { speak } from '@wordpress/a11y';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, InputControl, Link, Notice, Stack, Text } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
import { applyCloudflare, errorMessage } from '../../../data/api';
import { sendStore } from '../../../data/store';
import type {
	CloudflareApplyResult,
	CloudflareRecordResult,
	DnsPurpose,
} from '../../../data/types';
import type { FormEvent } from 'react';

export type CloudflareConnectProps = {
	domain: string;
	/** The records were written; the result carries the new status. */
	onApplied: ( result: CloudflareApplyResult ) => void;
	/** Close the form and add them by hand. */
	onCancel: () => void;
};

/**
 * Cloudflare's documented token template link, pre-filled with DNS edit rights and a name.
 *
 * @see https://developers.cloudflare.com/fundamentals/api/how-to/account-owned-token-template/
 * @param domain - The sending domain, used in the token's name.
 * @return The URL.
 */
export function cloudflareTokenUrl( domain: string ): string {
	return addQueryArgs( 'https://dash.cloudflare.com/profile/api-tokens', {
		permissionGroupKeys: JSON.stringify( [ { key: 'dns', type: 'edit' } ] ),
		accountId: '*',
		zoneId: 'all',
		name: `Jetpack Send ${ domain }`,
	} );
}

// After these the token itself is the problem, so it's cleared and has to be pasted again.
const NEW_TOKEN_CODES = [
	'jetpack_send_cloudflare_bad_token',
	'jetpack_send_cloudflare_no_zone',
	'jetpack_send_cloudflare_forbidden',
	'jetpack_send_cloudflare_too_broad',
];

type Problem =
	| { kind: 'error'; message: string; code: string }
	| { kind: 'partial'; failed: CloudflareRecordResult[] };

/**
 * What to say about the optional sender list when the run left it out, or '' when it went in.
 * Sending works without it, so this is information, not an error.
 *
 * @param result - The apply result.
 * @return The sentence, or ''.
 */
export function optionalRecordNote( result: CloudflareApplyResult ): string {
	const left = result.records.find(
		record =>
			record.optional &&
			record.purpose === 'spf' &&
			( record.action === 'skipped' || record.action === 'failed' )
	);
	if ( ! left ) {
		return '';
	}
	if ( left.reason === 'email_routing' ) {
		return __(
			'We left your domain’s sender list as it is, because Cloudflare Email Routing manages it. Sending doesn’t need it.',
			'jetpack-send-pkg'
		);
	}
	if ( left.reason === 'locked' ) {
		return __(
			'We left your domain’s sender list as it is, because Cloudflare has locked it. Sending doesn’t need it.',
			'jetpack-send-pkg'
		);
	}
	return __(
		'We couldn’t add Jetpack to your domain’s sender list. Sending doesn’t need it.',
		'jetpack-send-pkg'
	);
}

/**
 * The plain sentence for a token the server turned down.
 *
 * @param code    - REST error code.
 * @param message - The server's message, used for anything else.
 * @return The sentence.
 */
export function tokenProblemText( code: string, message: string ): string {
	if ( code === 'jetpack_send_cloudflare_forbidden' ) {
		return __( 'That token can only read DNS. Make one that can edit it.', 'jetpack-send-pkg' );
	}
	if ( NEW_TOKEN_CODES.includes( code ) ) {
		return __( 'That token didn’t work. Check you copied all of it.', 'jetpack-send-pkg' );
	}
	return message;
}

const recordLabel = ( purpose: DnsPurpose ) => {
	switch ( purpose ) {
		case 'lockdown':
			return __( 'Lets Jetpack send for you', 'jetpack-send-pkg' );
		case 'dkim':
			return __( 'Proves the emails are really yours', 'jetpack-send-pkg' );
		default:
			return __( 'Lists Jetpack as an approved sender', 'jetpack-send-pkg' );
	}
};

const errorCode = ( error: unknown ) =>
	error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
		? error.code
		: '';

/**
 * "Let Jetpack add them": paste a Cloudflare token, used once to write both records.
 *
 * @param props           - Component props.
 * @param props.domain    - The sending domain.
 * @param props.onApplied - Called with the result once both records are in.
 * @param props.onCancel  - Close the form.
 * @return The inline form.
 */
const CloudflareConnect = ( { domain, onApplied, onCancel }: CloudflareConnectProps ) => {
	const [ token, setToken ] = useState( '' );
	const [ busy, setBusy ] = useState( false );
	const [ problem, setProblem ] = useState< Problem | null >( null );
	const { receiveStatus } = useDispatch( sendStore );
	const fieldRef = useRef< HTMLInputElement >( null );

	useEffect( () => {
		fieldRef.current?.focus();
	}, [] );

	const submit = useCallback(
		async ( event?: FormEvent ) => {
			event?.preventDefault();
			const key = token.trim();
			if ( ! key || busy ) {
				return;
			}
			setBusy( true );
			setProblem( null );
			try {
				const result = await applyCloudflare( key );
				setToken( '' );
				receiveStatus( result.status );
				if ( result.success ) {
					const note = optionalRecordNote( result );
					const added = __( 'Records added. Checking for them now.', 'jetpack-send-pkg' );
					speak( note ? `${ added } ${ note }` : added );
					onApplied( result );
					return;
				}
				const failed = result.records.filter( record => record.action === 'failed' );
				setProblem( { kind: 'partial', failed } );
				speak( __( 'Some records didn’t go in.', 'jetpack-send-pkg' ), 'assertive' );
			} catch ( error ) {
				const code = errorCode( error );
				if ( NEW_TOKEN_CODES.includes( code ) ) {
					setToken( '' );
				}
				const message = tokenProblemText( code, errorMessage( error ) );
				setProblem( { kind: 'error', message, code } );
				speak( message, 'assertive' );
				window.requestAnimationFrame( () => fieldRef.current?.focus() );
			} finally {
				setBusy( false );
			}
		},
		[ token, busy, onApplied, receiveStatus ]
	);

	return (
		<Stack
			render={ <form onSubmit={ submit } /> }
			direction="column"
			gap="md"
			className="jetpack-send-setup__token"
		>
			<Text variant="body-lg" render={ <p /> }>
				{ sprintf(
					/* translators: %s: the sending domain, e.g. example.com. */
					__(
						'Paste a Cloudflare API token that can edit DNS for %s. We use it once to add the two records, then forget it.',
						'jetpack-send-pkg'
					),
					domain
				) }
			</Text>
			<InputControl
				ref={ fieldRef }
				label={ __( 'API token', 'jetpack-send-pkg' ) }
				type="password"
				// Keeps browsers and password managers from offering to save the token.
				autoComplete="new-password"
				data-1p-ignore
				data-lpignore="true"
				spellCheck={ false }
				value={ token }
				onValueChange={ setToken }
				// Read-only, not disabled, so focus stays in the field while the token is used.
				readOnly={ busy }
				aria-invalid={ problem?.kind === 'error' && NEW_TOKEN_CODES.includes( problem.code ) }
			/>
			<Text variant="body-lg" render={ <div /> }>
				<Link href={ cloudflareTokenUrl( domain ) } openInNewTab>
					{ __( 'How to make a token', 'jetpack-send-pkg' ) }
				</Link>
			</Text>

			{ problem?.kind === 'error' && (
				<Notice.Root intent="error">
					<Notice.Description>{ problem.message }</Notice.Description>
				</Notice.Root>
			) }

			{ problem?.kind === 'partial' && (
				<Notice.Root intent="error">
					<Notice.Title>{ __( 'Some records didn’t go in', 'jetpack-send-pkg' ) }</Notice.Title>
					{ problem.failed.length === 0 && (
						<Notice.Description>
							{ __( 'Nothing was added. Add the records yourself instead.', 'jetpack-send-pkg' ) }
						</Notice.Description>
					) }
					{ problem.failed.map( record => (
						<Notice.Description key={ record.name + record.purpose }>
							{ sprintf(
								/* translators: 1: what the record does, e.g. "Proves the emails are really yours". 2: why it failed. */
								__( '%1$s: %2$s', 'jetpack-send-pkg' ),
								recordLabel( record.purpose ),
								record.error ?? ''
							) }
						</Notice.Description>
					) ) }
				</Notice.Root>
			) }

			<Stack direction="row" align="center" gap="sm" wrap="wrap">
				<Button
					type="submit"
					variant="solid"
					disabled={ ! token.trim() }
					loading={ busy }
					loadingAnnouncement={ __( 'Adding your records…', 'jetpack-send-pkg' ) }
				>
					{ __( 'Add records', 'jetpack-send-pkg' ) }
				</Button>
				<Button variant="minimal" tone="neutral" onClick={ onCancel }>
					{ __( 'Cancel', 'jetpack-send-pkg' ) }
				</Button>
			</Stack>
		</Stack>
	);
};

export default CloudflareConnect;
