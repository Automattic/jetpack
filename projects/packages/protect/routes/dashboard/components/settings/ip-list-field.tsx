import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Stack, Text, TextareaControl } from '@wordpress/ui';
import { appendIp, getIpList, splitIps } from './ip-list';
import type { ProtectSettingsData } from '../../data/use-protect-settings';
import type { ChangeEvent } from 'react';

type Props = {
	data: ProtectSettingsData;
	name: string;
	label: string;
	/** Shown under the field; without one the label is hidden, for a toggle above that names the list. */
	description?: string;
	currentIp?: string;
};

/**
 * An editable list of IP addresses, saved with its own button.
 *
 * @param props             - Component props.
 * @param props.data        - The settings and their save function.
 * @param props.name        - The setting holding the list.
 * @param props.label       - The field's label.
 * @param props.description - What the list does; defaults to the format hint.
 * @param props.currentIp   - When set, offers to add the visitor's own address.
 * @return The field.
 */
export default function IpListField( { data, name, label, description, currentIp }: Props ) {
	const saved = getIpList( data.settings, name );
	const [ draft, setDraft ] = useState( saved );

	const lastSaved = useRef( saved );
	const submitted = useRef< string | null >( null );
	// `data.error` is keyed by setting, and another field can edit the same one.
	const [ saveFailed, setSaveFailed ] = useState( false );
	const saving = data.isSaving( name );

	// Follow `saved` unless the draft has edits, or `saved` moved because this field's own save failed.
	useEffect( () => {
		const previous = lastSaved.current;
		const rolledBack = submitted.current !== null && saved !== submitted.current;
		setDraft( current => ( current === previous && ! rolledBack ? saved : current ) );
		lastSaved.current = saved;
		if ( ! saving ) {
			submitted.current = null;
		}
	}, [ saved, saving ] );

	const onChange = useCallback(
		( event: ChangeEvent< HTMLTextAreaElement > ) => setDraft( event.target.value ),
		[]
	);
	const { save } = data;
	const onSave = useCallback( async () => {
		submitted.current = draft;
		setSaveFailed( false );
		const isSaved = await save( { [ name ]: draft } );
		setSaveFailed( ! isSaved );
		return isSaved;
	}, [ save, name, draft ] );
	const onAddIp = useCallback(
		() => setDraft( current => appendIp( current, currentIp ?? '' ) ),
		[ currentIp ]
	);

	const hasIp = !! currentIp && splitIps( draft ).includes( currentIp );

	return (
		<Stack direction="column" gap="sm">
			<TextareaControl
				label={ label }
				hideLabelFromVision={ ! description }
				description={
					description ??
					__(
						'Separate addresses or ranges with commas, spaces or new lines.',
						'jetpack-protect-pkg'
					)
				}
				value={ draft }
				onChange={ onChange }
				rows={ 4 }
				placeholder={ sprintf(
					/* translators: %s is a list of example IP addresses and ranges. */
					__( 'Example: %s', 'jetpack-protect-pkg' ),
					'12.12.12.1, 12.12.12.0/24, 12.12.12.1-12.12.12.100'
				) }
			/>
			{ saveFailed && data.error && data.errorKeys.includes( name ) && (
				<Text variant="body-sm" className="jp-protect-card__error" role="alert">
					{ data.error }
				</Text>
			) }
			<Stack direction="row" gap="sm" align="center">
				<Button
					variant="outline"
					size="compact"
					onClick={ onSave }
					disabled={ draft === saved || saving }
					loading={ saving }
				>
					{ __( 'Save', 'jetpack-protect-pkg' ) }
				</Button>
				{ currentIp && ! hasIp && (
					<Button variant="minimal" size="compact" onClick={ onAddIp }>
						{ sprintf(
							/* translators: %s is an IP address. */
							__( 'Add my IP address (%s)', 'jetpack-protect-pkg' ),
							currentIp
						) }
					</Button>
				) }
			</Stack>
		</Stack>
	);
}
