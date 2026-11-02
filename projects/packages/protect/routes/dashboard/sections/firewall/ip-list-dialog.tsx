import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Dialog, Stack, Text, TextareaControl } from '@wordpress/ui';
import { appendIp, getIpList, splitIps } from '../../components/settings/ip-list';
import { enabledKey } from './settings-keys';
import type { ProtectSettingsData } from '../../data/use-protect-settings';
import type { ChangeEvent, ReactElement, ReactNode } from 'react';

type DialogProps = {
	data: ProtectSettingsData;
	/** The setting holding the list; `enabledKey( name )` turns it on or off. */
	name: string;
	dialogTitle: string;
	currentIp?: string;
	/** The element that opens the dialog, such as a link-styled button; leave out when `open` is controlled. */
	trigger?: ReactElement< Record< string, unknown > >;
	/** Also turn the list on when saving addresses, for entry points without its toggle. */
	enableOnSave?: boolean;
	/** Whether the dialog is open, for a dialog opened from outside it. */
	open?: boolean;
	onOpenChange?: ( open: boolean ) => void;
	children?: ReactNode;
};

/**
 * A dialog to edit one of the firewall's IP lists.
 *
 * @param props              - Component props.
 * @param props.data         - The settings and their save function.
 * @param props.name         - The setting holding the list.
 * @param props.dialogTitle  - The dialog's title.
 * @param props.currentIp    - When set, the dialog offers to add the visitor's own address.
 * @param props.trigger      - The element that opens the dialog.
 * @param props.enableOnSave - Whether saving addresses also turns the list on.
 * @param props.open         - Whether the dialog is open, when controlled.
 * @param props.onOpenChange - Called when the dialog opens or closes.
 * @param props.children     - The trigger's content.
 * @return The dialog and its trigger.
 */
export function IpListDialog( {
	data,
	name,
	dialogTitle,
	currentIp,
	trigger,
	enableOnSave = false,
	open: controlledOpen,
	onOpenChange,
	children,
}: DialogProps ) {
	const { save, isSaving } = data;
	const saved = getIpList( data.settings, name );
	const [ ownOpen, setOwnOpen ] = useState( false );
	const open = controlledOpen ?? ownOpen;
	const [ draft, setDraft ] = useState( saved );
	// `data.error` is shared by every setting, so only show it for a save made from this dialog.
	const [ saveFailed, setSaveFailed ] = useState( false );

	// Start each edit from the saved list. Only on opening: a failed save rolls `saved` back mid-edit.
	const savedRef = useRef( saved );
	savedRef.current = saved;
	useEffect( () => {
		if ( open ) {
			setDraft( savedRef.current );
			setSaveFailed( false );
		}
	}, [ open ] );

	const setOpen = useCallback(
		( next: boolean ) => {
			setOwnOpen( next );
			onOpenChange?.( next );
		},
		[ onOpenChange ]
	);

	const onChange = useCallback(
		( event: ChangeEvent< HTMLTextAreaElement > ) => setDraft( event.target.value ),
		[]
	);
	const onAddIp = useCallback(
		() => setDraft( current => appendIp( current, currentIp ?? '' ) ),
		[ currentIp ]
	);
	// Saving can be the change itself: turning on a list someone left off.
	const enable =
		enableOnSave && splitIps( draft ).length > 0 && ! data.settings?.[ enabledKey( name ) ];
	const onSave = useCallback( async () => {
		const isSaved = await save( {
			[ name ]: draft,
			...( enable ? { [ enabledKey( name ) ]: true } : {} ),
		} );
		setSaveFailed( ! isSaved );
		if ( isSaved ) {
			setOpen( false );
		}
	}, [ save, name, draft, enable, setOpen ] );

	return (
		<Dialog.Root open={ open } onOpenChange={ setOpen }>
			{ trigger && <Dialog.Trigger render={ trigger }>{ children }</Dialog.Trigger> }
			<Dialog.Popup>
				<Dialog.Header>
					<Dialog.Title>{ dialogTitle }</Dialog.Title>
					<Dialog.CloseIconButton />
				</Dialog.Header>
				<Dialog.Content>
					<Stack direction="column" gap="sm" align="start">
						{ saveFailed && data.error && (
							<Text variant="body-sm" className="jp-protect-card__error" role="alert">
								{ data.error }
							</Text>
						) }
						<TextareaControl
							className="jp-protect-ip-rule__field"
							label={ __( 'IP addresses', 'jetpack-protect-pkg' ) }
							description={ sprintf(
								/* translators: 1: an example IP address range. 2: an example CIDR block. */
								__(
									'One per line. Use a range like %1$s or CIDR like %2$s.',
									'jetpack-protect-pkg'
								),
								'12.12.12.1-12.12.12.100',
								'12.12.12.0/24'
							) }
							value={ draft }
							onChange={ onChange }
							rows={ 8 }
						/>
						{ currentIp && (
							<Stack direction="row" gap="sm" align="center" wrap="wrap">
								<Text variant="body-sm">
									{ sprintf(
										/* translators: %s is an IP address. */
										__( 'Your IP address: %s', 'jetpack-protect-pkg' ),
										currentIp
									) }
								</Text>
								{ splitIps( draft ).includes( currentIp ) ? (
									<Text variant="body-sm" className="jp-protect-card__muted">
										{ __( 'Already on this list', 'jetpack-protect-pkg' ) }
									</Text>
								) : (
									<Button
										variant="unstyled"
										className="jp-protect-card__link-button"
										onClick={ onAddIp }
									>
										{ __( 'Add it to the list', 'jetpack-protect-pkg' ) }
									</Button>
								) }
							</Stack>
						) }
					</Stack>
				</Dialog.Content>
				<Dialog.Footer>
					<Dialog.Action variant="minimal">{ __( 'Cancel', 'jetpack-protect-pkg' ) }</Dialog.Action>
					<Button
						onClick={ onSave }
						loading={ isSaving( name ) }
						disabled={ draft === saved && ! enable }
					>
						{ __( 'Save', 'jetpack-protect-pkg' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
