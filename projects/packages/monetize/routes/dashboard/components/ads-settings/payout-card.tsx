import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { __ } from '@wordpress/i18n';
import { Button, Card, CheckboxControl, InputControl, Link, Notice, Stack } from '@wordpress/ui';
import { useCallback, useState } from 'react';
import { trackPayoutSave } from '../../data/tracking';
import { usePayout, useSavePayout } from '../../data/use-wpcom-ads-settings';

/**
 * Where ad earnings are paid, kept on WordPress.com.
 *
 * @param props           - Component props.
 * @param props.adsActive - Whether ads are on, so earnings are building up.
 * @return The card.
 */
export function PayoutCard( { adsActive }: { adsActive: boolean } ) {
	const payout = usePayout();
	const save = useSavePayout();
	// Undefined until edited, so the stored address shows once it loads.
	const [ paypal, setPaypal ] = useState< string >();
	const [ agreed, setAgreed ] = useState( false );

	const stored = payout.data;
	const address = paypal ?? stored?.paypal ?? '';
	const tosSigned = Boolean( stored?.tosSigned );

	const onPaypalChange = useCallback( ( next: unknown ) => setPaypal( String( next ?? '' ) ), [] );
	const onSave = useCallback( () => {
		save.mutate(
			{ paypal: address, tos: agreed },
			{
				onSuccess: () => {
					trackPayoutSave( agreed );
					setPaypal( undefined );
					setAgreed( false );
				},
			}
		);
	}, [ save, address, agreed ] );

	// The card shows from the start, its fields disabled until WordPress.com answers.
	const isReady = Boolean( stored );
	const isDisabled = ! isReady || save.isPending;
	const canSave =
		isReady &&
		address !== '' &&
		( address !== stored?.paypal || agreed ) &&
		( tosSigned || agreed );

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h2 /> }>{ __( 'Payouts', 'jetpack-monetize' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg" align="start" aria-busy={ payout.isPending }>
					{ payout.isError && (
						<Notice.Root intent="error">
							<Notice.Description>
								{ __( 'Your payout details could not be loaded.', 'jetpack-monetize' ) }
							</Notice.Description>
						</Notice.Root>
					) }
					{ adsActive && isReady && ! stored?.paypal && (
						<Notice.Root intent="warning">
							<Notice.Description>
								{ __(
									'Add a PayPal address to get paid. Your ads earn without one, but earnings aren’t paid out until you add it.',
									'jetpack-monetize'
								) }
							</Notice.Description>
						</Notice.Root>
					) }
					{ save.isError && (
						<Notice.Root intent="error">
							<Notice.Description>
								{ save.error.message ||
									__( 'Your payout details could not be saved.', 'jetpack-monetize' ) }
							</Notice.Description>
						</Notice.Root>
					) }
					<InputControl
						type="email"
						label={ __( 'PayPal email address', 'jetpack-monetize' ) }
						description={ __( 'Ad earnings are paid to this PayPal account.', 'jetpack-monetize' ) }
						value={ address }
						disabled={ isDisabled }
						onValueChange={ onPaypalChange }
					/>
					{ isReady && ! tosSigned && (
						<CheckboxControl
							label={ __( 'I agree to the Automattic Ads Terms of Service.', 'jetpack-monetize' ) }
							details={
								<Link href={ getRedirectUrl( 'wpcom-automattic-ads-tos' ) } openInNewTab>
									{ __( 'Read the Terms of Service', 'jetpack-monetize' ) }
								</Link>
							}
							checked={ agreed }
							disabled={ isDisabled }
							onCheckedChange={ setAgreed }
						/>
					) }
					<Button disabled={ ! canSave } loading={ save.isPending } onClick={ onSave }>
						{ __( 'Save', 'jetpack-monetize' ) }
					</Button>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
