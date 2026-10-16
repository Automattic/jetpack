import { TextControl } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Card, Notice, Stack } from '@wordpress/ui';
import ErrorNotice from '../../components/error-notice';
import { errorMessage, sendTest } from '../../data/api';
import type { TestResult } from '../../data/types';
import type { FormEvent } from 'react';

const TestEmailCard = ( { defaultTo }: { defaultTo: string } ) => {
	const [ to, setTo ] = useState( defaultTo );
	const [ busy, setBusy ] = useState( false );
	const [ result, setResult ] = useState< TestResult | null >( null );

	const onSubmit = useCallback(
		async ( event: FormEvent ) => {
			event.preventDefault();
			setBusy( true );
			setResult( null );
			try {
				setResult( await sendTest( to ) );
			} catch ( e ) {
				setResult( { success: false, error: errorMessage( e ) } );
			} finally {
				setBusy( false );
			}
		},
		[ to ]
	);

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Send a test email', 'jetpack-send-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<form onSubmit={ onSubmit }>
					<Stack direction="column" gap="md">
						<TextControl
							type="email"
							label={ __( 'Recipient', 'jetpack-send-pkg' ) }
							value={ to }
							onChange={ setTo }
						/>
						{ result?.success && (
							<Notice.Root intent="success">
								<Notice.Description>
									{ sprintf(
										/* translators: %s: MailChannels request ID. */
										__( 'Sent. MailChannels request ID: %s', 'jetpack-send-pkg' ),
										result.request_id ?? ''
									) }
								</Notice.Description>
							</Notice.Root>
						) }
						{ result && ! result.success && <ErrorNotice message={ result.error ?? '' } /> }
						<div>
							<Button type="submit" loading={ busy } disabled={ busy || ! to }>
								{ __( 'Send test', 'jetpack-send-pkg' ) }
							</Button>
						</div>
					</Stack>
				</form>
			</Card.Content>
		</Card.Root>
	);
};

export default TestEmailCard;
