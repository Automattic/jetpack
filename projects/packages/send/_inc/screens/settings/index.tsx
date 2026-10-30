import { ToggleControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { AlertDialog, Button, Card, InputControl, InputLayout, Stack, Text } from '@wordpress/ui';
import ErrorNotice from '../../components/error-notice';
import { errorMessage, postAction } from '../../data/api';
import { sendStore, useSendAction } from '../../data/store';
import type { Account, SendStatus } from '../../data/types';
import type { FormEvent } from 'react';

type Props = { status: SendStatus; account: Account };

const SenderCard = ( { status, account }: Props ) => {
	const { settings } = status;
	const [ fromName, setFromName ] = useState( settings.from_name );
	const [ localPart, setLocalPart ] = useState( settings.from_local_part );
	const [ justSaved, setJustSaved ] = useState( false );
	const { run, busy, error } = useSendAction();

	const dirty = fromName !== settings.from_name || localPart !== settings.from_local_part;
	const displayName = fromName.trim() || status.site_title;
	const address = `${ localPart.trim() || 'wordpress' }@${ account.domain }`;

	const onNameChange = useCallback( ( value: string ) => {
		setFromName( value );
		setJustSaved( false );
	}, [] );
	const onLocalPartChange = useCallback( ( value: string ) => {
		setLocalPart( value );
		setJustSaved( false );
	}, [] );
	const onSubmit = useCallback(
		async ( event: FormEvent ) => {
			event.preventDefault();
			if ( await run( 'settings', { from_name: fromName, from_local_part: localPart } ) ) {
				setJustSaved( true );
			}
		},
		[ run, fromName, localPart ]
	);

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Sender', 'jetpack-send-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<form onSubmit={ onSubmit }>
					<Stack direction="column" gap="lg">
						<div className="jetpack-send-sender-preview" aria-hidden="true">
							<span className="jetpack-send-sender-preview__avatar">
								{ displayName.charAt( 0 ).toUpperCase() }
							</span>
							<span className="jetpack-send-sender-preview__text">
								<span className="jetpack-send-sender-preview__name">{ displayName }</span>
								<span className="jetpack-send-sender-preview__address">{ address }</span>
							</span>
							<Text variant="body-sm" className="jetpack-send-sender-preview__hint">
								{ __( 'How your emails appear in inboxes', 'jetpack-send-pkg' ) }
							</Text>
						</div>
						<InputControl
							label={ __( 'From name', 'jetpack-send-pkg' ) }
							description={ __( 'Leave blank to use your site title.', 'jetpack-send-pkg' ) }
							placeholder={ status.site_title }
							value={ fromName }
							onValueChange={ onNameChange }
						/>
						<InputControl
							label={ __( 'From address', 'jetpack-send-pkg' ) }
							description={ sprintf(
								/* translators: %s: sending domain. */
								__(
									'Emails must come from %s, your verified sending domain. Replies go to this address unless an email sets its own Reply-To.',
									'jetpack-send-pkg'
								),
								account.domain
							) }
							value={ localPart }
							onValueChange={ onLocalPartChange }
							suffix={ <InputLayout.Slot>{ `@${ account.domain }` }</InputLayout.Slot> }
						/>
						{ error && <ErrorNotice message={ error } /> }
						<div className="jetpack-send-form-actions">
							<Button
								type="submit"
								loading={ !! busy }
								disabled={ !! busy || ! dirty || ! localPart.trim() }
							>
								{ __( 'Save', 'jetpack-send-pkg' ) }
							</Button>
							{ justSaved && ! dirty && (
								<Text variant="body-sm" className="jetpack-send-saved" role="status">
									{ __( 'Saved', 'jetpack-send-pkg' ) }
								</Text>
							) }
						</div>
					</Stack>
				</form>
			</Card.Content>
		</Card.Root>
	);
};

const DeliveryCard = ( { status }: Pick< Props, 'status' > ) => {
	const { fallback } = status.settings;
	const { run, busy, error } = useSendAction();
	const { receiveStatus } = useDispatch( sendStore );
	const [ confirmOff, setConfirmOff ] = useState( false );

	// Turning fallback on is safe; turning it off can lose mail, so it asks first.
	const onToggle = useCallback(
		( next: boolean ) => ( next ? run( 'settings', { fallback: true } ) : setConfirmOff( true ) ),
		[ run ]
	);
	const onConfirmOff = useCallback( async () => {
		try {
			receiveStatus( await postAction( 'settings', { fallback: false } ) );
		} catch ( e ) {
			return { close: false, error: errorMessage( e ) };
		}
	}, [ receiveStatus ] );

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Delivery', 'jetpack-send-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					<ToggleControl
						label={ __( 'Fall back to your host’s mail', 'jetpack-send-pkg' ) }
						help={
							fallback
								? __(
										'If MailChannels can’t deliver an email, your host’s mail sends it instead, so password resets and receipts keep flowing. These emails show as Fallback in the Log.',
										'jetpack-send-pkg'
									)
								: __(
										'If MailChannels can’t deliver an email, it isn’t sent. Failed emails show in the Log.',
										'jetpack-send-pkg'
									)
						}
						checked={ fallback }
						disabled={ !! busy }
						onChange={ onToggle }
					/>
					{ error && <ErrorNotice message={ error } /> }
				</Stack>
			</Card.Content>
			<AlertDialog.Root
				open={ confirmOff }
				onOpenChange={ setConfirmOff }
				onConfirm={ onConfirmOff }
			>
				<AlertDialog.Popup
					title={ __( 'Turn off fallback?', 'jetpack-send-pkg' ) }
					description={ __(
						'Emails MailChannels can’t deliver won’t be sent at all, including password resets and order receipts. You can turn fallback back on anytime.',
						'jetpack-send-pkg'
					) }
					confirmButtonText={ __( 'Turn off', 'jetpack-send-pkg' ) }
				/>
			</AlertDialog.Root>
		</Card.Root>
	);
};

const AccountCard = ( { account }: Pick< Props, 'account' > ) => {
	const { receiveStatus } = useDispatch( sendStore );
	const navigate = useNavigate();
	const [ confirmReset, setConfirmReset ] = useState( false );

	const onReset = useCallback( async () => {
		try {
			receiveStatus( await postAction( 'reset' ) );
		} catch ( e ) {
			return { close: false, error: errorMessage( e ) };
		}
		navigate( { href: '/' } );
	}, [ receiveStatus, navigate ] );
	const openConfirm = useCallback( () => setConfirmReset( true ), [] );

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Sending account', 'jetpack-send-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					<dl className="jetpack-send-account">
						<dt>{ __( 'Domain', 'jetpack-send-pkg' ) }</dt>
						<dd>{ account.domain }</dd>
						<dt>{ __( 'MailChannels account', 'jetpack-send-pkg' ) }</dt>
						<dd>
							<code>{ account.handle }</code>
						</dd>
						<dt>{ __( 'Managed by', 'jetpack-send-pkg' ) }</dt>
						<dd>
							{ account.provider === 'wpcom'
								? __( 'WordPress.com', 'jetpack-send-pkg' )
								: __( 'Development provisioner', 'jetpack-send-pkg' ) }
						</dd>
						<dt>{ __( 'Set up', 'jetpack-send-pkg' ) }</dt>
						<dd>{ new Date( account.provisioned_at ).toLocaleDateString() }</dd>
					</dl>
					<div className="jetpack-send-danger">
						<Text variant="heading-sm">{ __( 'Reset Send', 'jetpack-send-pkg' ) }</Text>
						<Text variant="body-md" render={ <p /> }>
							{ __(
								'Turns off sending and removes this site’s MailChannels account. Your DNS records stay at your provider until you delete them. You can set Send up again anytime.',
								'jetpack-send-pkg'
							) }
						</Text>
						<div>
							<Button variant="outline" tone="neutral" onClick={ openConfirm }>
								{ __( 'Reset Send', 'jetpack-send-pkg' ) }
							</Button>
						</div>
					</div>
				</Stack>
			</Card.Content>
			<AlertDialog.Root
				open={ confirmReset }
				onOpenChange={ setConfirmReset }
				onConfirm={ onReset }
			>
				<AlertDialog.Popup
					intent="irreversible"
					title={ __( 'Reset Send?', 'jetpack-send-pkg' ) }
					description={ sprintf(
						/* translators: %s: sending domain. */
						__(
							'WordPress goes back to your host’s mail and this site’s MailChannels account is removed. To use Send again, you’ll set it up for %s from the start.',
							'jetpack-send-pkg'
						),
						account.domain
					) }
					confirmButtonText={ __( 'Reset', 'jetpack-send-pkg' ) }
				/>
			</AlertDialog.Root>
		</Card.Root>
	);
};

const SettingsScreen = ( { status, account }: Props ) => (
	<>
		<SenderCard status={ status } account={ account } />
		<DeliveryCard status={ status } />
		<AccountCard account={ account } />
	</>
);

export default SettingsScreen;
