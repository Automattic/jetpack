import { TextControl, ToggleControl } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { AlertDialog, Button, Card, Notice, Stack, Text } from '@wordpress/ui';
import ErrorNotice from '../../components/error-notice';
import { useSendAction } from '../../data/store';
import type { Account, SendStatus } from '../../data/types';
import type { FormEvent } from 'react';

const SettingsScreen = ( { status, account }: { status: SendStatus; account: Account } ) => {
	const { settings } = status;
	const [ fromName, setFromName ] = useState( settings.from_name );
	const [ localPart, setLocalPart ] = useState( settings.from_local_part );
	const [ fallback, setFallback ] = useState( settings.fallback );
	const [ saved, setSaved ] = useState( false );
	const [ confirmOpen, setConfirmOpen ] = useState( false );
	const { run, busy, error } = useSendAction();
	const navigate = useNavigate();

	const onSubmit = useCallback(
		async ( event: FormEvent ) => {
			event.preventDefault();
			setSaved( false );
			if (
				await run( 'settings', { from_name: fromName, from_local_part: localPart, fallback } )
			) {
				setSaved( true );
			}
		},
		[ run, fromName, localPart, fallback ]
	);

	const onReset = useCallback( async () => {
		const result = await run( 'reset' );
		if ( ! result ) {
			return { close: false, error: __( 'Reset failed. Please try again.', 'jetpack-send-pkg' ) };
		}
		navigate( { href: '/' } );
	}, [ run, navigate ] );

	const openConfirm = useCallback( () => setConfirmOpen( true ), [] );

	return (
		<>
			<Card.Root>
				<Card.Header>
					<Card.Title>{ __( 'Sender', 'jetpack-send-pkg' ) }</Card.Title>
				</Card.Header>
				<Card.Content>
					<form onSubmit={ onSubmit }>
						<Stack direction="column" gap="md">
							<TextControl
								label={ __( 'From name', 'jetpack-send-pkg' ) }
								placeholder={ status.site_title }
								help={ __( 'Leave blank to use your site title.', 'jetpack-send-pkg' ) }
								value={ fromName }
								onChange={ setFromName }
							/>
							<div className="jetpack-send-from">
								<TextControl
									label={ __( 'From address', 'jetpack-send-pkg' ) }
									value={ localPart }
									onChange={ setLocalPart }
								/>
								<Text variant="body-md" className="jetpack-send-from__domain">
									{ `@${ account.domain }` }
								</Text>
							</div>
							<ToggleControl
								label={ __( 'Fall back to default mail if Send fails', 'jetpack-send-pkg' ) }
								help={ __(
									'Keeps password resets and receipts flowing if MailChannels is unreachable or rejects a message.',
									'jetpack-send-pkg'
								) }
								checked={ fallback }
								onChange={ setFallback }
							/>
							{ error && <ErrorNotice message={ error } /> }
							{ saved && (
								<Notice.Root intent="success">
									<Notice.Description>
										{ __( 'Settings saved.', 'jetpack-send-pkg' ) }
									</Notice.Description>
								</Notice.Root>
							) }
							<div>
								<Button
									type="submit"
									loading={ busy === 'settings' }
									disabled={ !! busy || ! localPart }
								>
									{ __( 'Save', 'jetpack-send-pkg' ) }
								</Button>
							</div>
						</Stack>
					</form>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Header>
					<Card.Title>{ __( 'Reset Send', 'jetpack-send-pkg' ) }</Card.Title>
				</Card.Header>
				<Card.Content>
					<Stack direction="column" gap="md">
						<Text variant="body-md" render={ <p /> }>
							{ __(
								'Stops sending through MailChannels and removes this site’s sending account. You can set Send up again afterwards.',
								'jetpack-send-pkg'
							) }
						</Text>
						<div>
							<Button variant="outline" onClick={ openConfirm } disabled={ !! busy }>
								{ __( 'Reset Send', 'jetpack-send-pkg' ) }
							</Button>
						</div>
					</Stack>
				</Card.Content>
			</Card.Root>
			<AlertDialog.Root open={ confirmOpen } onOpenChange={ setConfirmOpen } onConfirm={ onReset }>
				<AlertDialog.Popup
					intent="irreversible"
					title={ __( 'Reset Send?', 'jetpack-send-pkg' ) }
					description={ __(
						'Your site will go back to its default mail, and you can remove the Send DNS records.',
						'jetpack-send-pkg'
					) }
					confirmButtonText={ __( 'Reset', 'jetpack-send-pkg' ) }
				/>
			</AlertDialog.Root>
		</>
	);
};

export default SettingsScreen;
