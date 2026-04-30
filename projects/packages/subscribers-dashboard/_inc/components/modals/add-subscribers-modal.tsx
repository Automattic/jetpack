import { TextareaControl } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, Dialog, Notice, Stack } from '@wordpress/ui';
import { useAddSubscribersMutation } from '../../data/use-add-subscribers-mutation';

type Props = {
	isOpen: boolean;
	onClose: () => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Split a textarea body into individual addresses. Accepts newlines, commas, semicolons, or
 * whitespace as separators — same forgiving parser Calypso uses.
 *
 * @param raw - Raw textarea content.
 * @return Trimmed, non-empty entries.
 */
function splitEntries( raw: string ): string[] {
	return raw
		.split( /[\s,;]+/ )
		.map( entry => entry.trim() )
		.filter( Boolean );
}

/**
 * Modal that invites new subscribers by email. Manual entry only in this phase — CSV upload and
 * Substack import follow in Phase 5b.
 *
 * @param props         - Component props.
 * @param props.isOpen  - Whether the modal is open.
 * @param props.onClose - Close handler.
 * @return Modal element or null when closed.
 */
export default function AddSubscribersModal( { isOpen, onClose }: Props ): JSX.Element | null {
	const [ value, setValue ] = useState( '' );
	const mutation = useAddSubscribersMutation();

	const { valid, invalid } = useMemo( () => {
		const entries = splitEntries( value );
		return {
			valid: entries.filter( entry => EMAIL_RE.test( entry ) ),
			invalid: entries.filter( entry => ! EMAIL_RE.test( entry ) ),
		};
	}, [ value ] );

	const handleSubmit = useCallback( () => {
		if ( valid.length === 0 ) {
			return;
		}
		mutation.mutate( valid, {
			onSuccess: () => {
				setValue( '' );
				onClose();
			},
		} );
	}, [ mutation, onClose, valid ] );

	const handleOpenChange = useCallback(
		( nextOpen: boolean ) => {
			if ( ! nextOpen ) {
				onClose();
			}
		},
		[ onClose ]
	);

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Dialog.Root open onOpenChange={ handleOpenChange }>
			<Dialog.Popup>
				<Dialog.Header>
					<Dialog.Title>{ __( 'Add subscribers', 'jetpack-subscribers-dashboard' ) }</Dialog.Title>
					<Dialog.CloseIcon />
				</Dialog.Header>
				<Stack direction="column" gap="md">
					<TextareaControl
						__nextHasNoMarginBottom
						label={ __( 'Email addresses', 'jetpack-subscribers-dashboard' ) }
						help={ __(
							'Enter one email per line. Subscribers receive an invitation by email.',
							'jetpack-subscribers-dashboard'
						) }
						value={ value }
						onChange={ setValue }
						rows={ 6 }
						placeholder="reader@example.com&#10;another@example.com"
					/>
					{ invalid.length > 0 ? (
						<Notice.Root intent="warning">
							<Notice.Description>
								{ sprintf(
									// translators: %s: comma-separated list of invalid email addresses.
									__(
										'These entries don’t look like valid email addresses and will be skipped: %s',
										'jetpack-subscribers-dashboard'
									),
									invalid.join( ', ' )
								) }
							</Notice.Description>
						</Notice.Root>
					) : null }
				</Stack>
				<Dialog.Footer>
					<Dialog.Action
						render={ <Button variant="outline" tone="neutral" /> }
						onClick={ onClose }
						disabled={ mutation.isPending }
					>
						{ __( 'Cancel', 'jetpack-subscribers-dashboard' ) }
					</Dialog.Action>
					<Button
						onClick={ handleSubmit }
						loading={ mutation.isPending }
						disabled={ mutation.isPending || valid.length === 0 }
					>
						{ valid.length > 0
							? sprintf(
									// translators: %d: number of subscribers to invite.
									_n(
										'Invite %d subscriber',
										'Invite %d subscribers',
										valid.length,
										'jetpack-subscribers-dashboard'
									),
									valid.length
							  )
							: __( 'Add subscribers', 'jetpack-subscribers-dashboard' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
