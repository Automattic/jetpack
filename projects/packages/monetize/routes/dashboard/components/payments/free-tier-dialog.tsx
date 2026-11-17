import { __, sprintf } from '@wordpress/i18n';
import { Button, CheckboxControl, Dialog, Notice, Stack, TextareaControl } from '@wordpress/ui';
import { useCallback, useState } from 'react';
import { FREE_TIER_DESCRIPTION_MAX, useSaveFreeTier } from '../../data/free-tier';
import { trackPaymentsEvent } from '../../data/tracking';
import type { FreeTier } from '../../data/free-tier';
import type { ChangeEvent } from 'react';

/**
 * Edits the free newsletter tier's description and whether subscribers see it.
 *
 * @param props          - Component props.
 * @param props.freeTier - The saved free tier.
 * @param props.onClose  - Called once the dialog should go.
 * @return The dialog.
 */
export default function FreeTierDialog( {
	freeTier,
	onClose,
}: {
	freeTier: FreeTier;
	onClose: () => void;
} ) {
	const [ description, setDescription ] = useState( freeTier.description );
	const [ hidden, setHidden ] = useState( freeTier.hidden );
	const { mutate, isPending, isError, error } = useSaveFreeTier();
	const isTooLong = description.trim().length > FREE_TIER_DESCRIPTION_MAX;

	const onOpenChange = useCallback(
		( open: boolean ) => {
			// Held open mid-save, so a failure still has somewhere to show.
			if ( ! open && ! isPending ) {
				onClose();
			}
		},
		[ isPending, onClose ]
	);
	const onDescriptionChange = useCallback(
		( event: ChangeEvent< HTMLTextAreaElement > ) => setDescription( event.target.value ),
		[]
	);
	const onSave = useCallback( () => {
		mutate(
			{ description, hidden },
			{
				onSuccess: () => {
					trackPaymentsEvent( 'free_tier_update', { hide_free_tier: hidden } );
					onClose();
				},
			}
		);
	}, [ description, hidden, mutate, onClose ] );

	return (
		<Dialog.Root open onOpenChange={ onOpenChange }>
			<Dialog.Popup size="medium">
				<Dialog.Header>
					<Dialog.Title>{ __( 'Edit the free tier', 'jetpack-monetize' ) }</Dialog.Title>
					<Dialog.CloseIconButton disabled={ isPending } />
				</Dialog.Header>
				<Dialog.Content>
					<Stack direction="column" gap="lg">
						<TextareaControl
							label={ __( 'Description', 'jetpack-monetize' ) }
							description={ sprintf(
								/* translators: %1$d: characters used. %2$d: the most allowed. */
								__( '%1$d/%2$d characters. Markdown is supported.', 'jetpack-monetize' ),
								description.trim().length,
								FREE_TIER_DESCRIPTION_MAX
							) }
							value={ description }
							onChange={ onDescriptionChange }
							disabled={ isPending }
						/>
						<CheckboxControl
							label={ __( 'Hide the free tier from subscribers', 'jetpack-monetize' ) }
							checked={ hidden }
							onCheckedChange={ setHidden }
							disabled={ isPending }
						/>
						{ isError && (
							<Notice.Root intent="error">
								<Notice.Description>
									{ error.message ||
										__(
											'The free tier could not be saved. Please try again.',
											'jetpack-monetize'
										) }
								</Notice.Description>
							</Notice.Root>
						) }
					</Stack>
				</Dialog.Content>
				<Dialog.Footer>
					<Button variant="outline" tone="neutral" onClick={ onClose } disabled={ isPending }>
						{ __( 'Cancel', 'jetpack-monetize' ) }
					</Button>
					<Button onClick={ onSave } disabled={ isTooLong } loading={ isPending }>
						{ __( 'Save', 'jetpack-monetize' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
