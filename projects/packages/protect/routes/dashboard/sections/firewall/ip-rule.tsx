import { ToggleControl } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Badge, Button, Dialog, Stack, Text, TextareaControl, VisuallyHidden } from '@wordpress/ui';
import { appendIp, splitIps } from '../../components/settings/ip-list';
import type { ProtectSettingsData } from '../../data/use-protect-settings';
import type { ChangeEvent } from 'react';

type Props = {
	data: ProtectSettingsData;
	/** The setting holding the list; its on/off setting is `${ name }_enabled`. */
	name: string;
	label: string;
	description: string;
	editLabel: string;
	dialogTitle: string;
	currentIp?: string;
};

/**
 * One of the firewall's IP lists: its on/off toggle, how many addresses it holds and a dialog to edit them.
 *
 * @param props             - Component props.
 * @param props.data        - The settings and their save function.
 * @param props.name        - The setting holding the list.
 * @param props.label       - The toggle's label.
 * @param props.description - What the list does.
 * @param props.editLabel   - The link that opens the dialog.
 * @param props.dialogTitle - The dialog's title.
 * @param props.currentIp   - When set, the dialog offers to add the visitor's own address.
 * @return The rule.
 */
export default function IpRule( {
	data,
	name,
	label,
	description,
	editLabel,
	dialogTitle,
	currentIp,
}: Props ) {
	const { save, isSaving } = data;
	const enabledName = `${ name }_enabled`;
	const saved =
		typeof data.settings?.[ name ] === 'string' ? ( data.settings[ name ] as string ) : '';
	const [ open, setOpen ] = useState( false );
	const [ draft, setDraft ] = useState( saved );
	// `data.error` is shared by every setting, so only show it for a save made from this dialog.
	const [ saveFailed, setSaveFailed ] = useState( false );
	const count = splitIps( saved ).length;

	// Start each edit from the saved list. Only on opening: a failed save rolls `saved` back mid-edit.
	const onOpenChange = useCallback(
		( next: boolean ) => {
			if ( next ) {
				setDraft( saved );
				setSaveFailed( false );
			}
			setOpen( next );
		},
		[ saved ]
	);

	const onToggle = useCallback(
		( value: boolean ) => save( { [ enabledName ]: value } ),
		[ save, enabledName ]
	);
	const onChange = useCallback(
		( event: ChangeEvent< HTMLTextAreaElement > ) => setDraft( event.target.value ),
		[]
	);
	const onAddIp = useCallback(
		() => setDraft( current => appendIp( current, currentIp ?? '' ) ),
		[ currentIp ]
	);
	const onSave = useCallback( async () => {
		const isSaved = await save( { [ name ]: draft } );
		setSaveFailed( ! isSaved );
		if ( isSaved ) {
			setOpen( false );
		}
	}, [ save, name, draft ] );

	return (
		<Stack direction="column" gap="sm" align="start">
			<ToggleControl
				__nextHasNoMarginBottom
				label={
					<Stack direction="row" gap="sm" align="center">
						{ label }
						<span aria-hidden="true">
							<Badge intent="informational">{ String( count ) }</Badge>
						</span>
						<VisuallyHidden>
							{ sprintf(
								/* translators: %d is how many IP addresses are on a list. */
								_n(
									'%d address on the list',
									'%d addresses on the list',
									count,
									'jetpack-protect-pkg'
								),
								count
							) }
						</VisuallyHidden>
					</Stack>
				}
				help={ description }
				checked={ Boolean( data.settings?.[ enabledName ] ) }
				disabled={ isSaving( enabledName ) }
				onChange={ onToggle }
			/>
			<Dialog.Root open={ open } onOpenChange={ onOpenChange }>
				<Dialog.Trigger
					render={ <Button variant="unstyled" className="jp-protect-card__link-button" /> }
				>
					{ editLabel }
				</Dialog.Trigger>
				<Dialog.Popup>
					<Dialog.Header>
						<Dialog.Title>{ dialogTitle }</Dialog.Title>
						<Dialog.CloseIcon />
					</Dialog.Header>
					<Dialog.Content>
						<Stack direction="column" gap="sm" align="start">
							{ saveFailed && data.error && (
								<Text variant="body-sm" className="jp-protect-ip-rule__error" role="alert">
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
						<Dialog.Action variant="minimal">
							{ __( 'Cancel', 'jetpack-protect-pkg' ) }
						</Dialog.Action>
						<Button onClick={ onSave } loading={ isSaving( name ) } disabled={ draft === saved }>
							{ __( 'Save', 'jetpack-protect-pkg' ) }
						</Button>
					</Dialog.Footer>
				</Dialog.Popup>
			</Dialog.Root>
		</Stack>
	);
}
