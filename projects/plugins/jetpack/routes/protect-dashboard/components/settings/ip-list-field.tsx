import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Stack, TextareaControl } from '@wordpress/ui';
import type { ProtectSettingsData } from '../../data/use-protect-settings';
import type { ChangeEvent } from 'react';

type Props = {
	data: ProtectSettingsData;
	name: string;
	label: string;
	description: string;
	currentIp?: string;
};

/**
 * An editable list of IP addresses, saved with its own button.
 *
 * @param props             - Component props.
 * @param props.data        - The settings and their save function.
 * @param props.name        - The setting holding the list.
 * @param props.label       - The field's label.
 * @param props.description - What the list does.
 * @param props.currentIp   - When set, offers to add the visitor's own address.
 * @return The field.
 */
export default function IpListField( { data, name, label, description, currentIp }: Props ) {
	const saved =
		typeof data.settings?.[ name ] === 'string' ? ( data.settings[ name ] as string ) : '';
	const [ draft, setDraft ] = useState( saved );

	useEffect( () => setDraft( saved ), [ saved ] );

	const onChange = useCallback(
		( event: ChangeEvent< HTMLTextAreaElement > ) => setDraft( event.target.value ),
		[]
	);
	const { save } = data;
	const onSave = useCallback( () => save( { [ name ]: draft } ), [ save, name, draft ] );
	const onAddIp = useCallback(
		() =>
			setDraft( current =>
				current.trim() ? `${ current.trim() }\n${ currentIp }` : `${ currentIp }`
			),
		[ currentIp ]
	);

	const hasIp = !! currentIp && draft.split( /\s+/ ).includes( currentIp );

	return (
		<Stack direction="column" gap="sm">
			<TextareaControl
				label={ label }
				description={ description }
				value={ draft }
				onChange={ onChange }
				rows={ 4 }
				placeholder={ sprintf(
					/* translators: %s is a list of example IP addresses and ranges. */
					__( 'Example: %s', 'jetpack' ),
					'12.12.12.1, 12.12.12.0/24, 12.12.12.1-12.12.12.100'
				) }
			/>
			<Stack direction="row" gap="sm" align="center">
				<Button
					variant="outline"
					size="compact"
					onClick={ onSave }
					disabled={ draft === saved || data.isSaving( name ) }
					loading={ data.isSaving( name ) }
				>
					{ __( 'Save', 'jetpack' ) }
				</Button>
				{ currentIp && ! hasIp && (
					<Button variant="minimal" size="compact" onClick={ onAddIp }>
						{ sprintf(
							/* translators: %s is an IP address. */
							__( 'Add my IP address (%s)', 'jetpack' ),
							currentIp
						) }
					</Button>
				) }
			</Stack>
		</Stack>
	);
}
