import { TextControl } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import ErrorNotice from '../../components/error-notice';
import { useSendAction } from '../../data/store';
import type { FormEvent } from 'react';

const SetupCard = ( { suggestedDomain }: { suggestedDomain: string } ) => {
	const [ domain, setDomain ] = useState( suggestedDomain );
	const { run, busy, error } = useSendAction();
	const onSubmit = useCallback(
		( event: FormEvent ) => {
			event.preventDefault();
			run( 'setup', { domain } );
		},
		[ run, domain ]
	);

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Set up Send', 'jetpack-send-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<form onSubmit={ onSubmit }>
					<Stack direction="column" gap="md">
						<Text variant="body-md" render={ <p /> }>
							{ __(
								'Send routes every email WordPress sends through MailChannels. Choose the domain your emails come from; next you will add a few DNS records to it.',
								'jetpack-send-pkg'
							) }
						</Text>
						<TextControl
							label={ __( 'Sending domain', 'jetpack-send-pkg' ) }
							help={ __( 'Use a domain whose DNS records you can edit.', 'jetpack-send-pkg' ) }
							value={ domain }
							onChange={ setDomain }
						/>
						{ error && <ErrorNotice message={ error } /> }
						<div>
							<Button type="submit" loading={ busy === 'setup' } disabled={ !! busy || ! domain }>
								{ __( 'Set up', 'jetpack-send-pkg' ) }
							</Button>
						</div>
					</Stack>
				</form>
			</Card.Content>
		</Card.Root>
	);
};

export default SetupCard;
