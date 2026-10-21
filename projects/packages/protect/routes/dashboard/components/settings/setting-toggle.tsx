import { useCallback } from '@wordpress/element';
import { SwitchControl } from '@wordpress/ui';
import type { ProtectSettingsData } from '../../data/use-protect-settings';

type Props = {
	data: ProtectSettingsData;
	name: string;
	label: string;
	help?: string;
	disabled?: boolean;
};

/**
 * A toggle bound to one Jetpack setting or module, saved as soon as it changes.
 *
 * @param props          - Component props.
 * @param props.data     - The settings and their save function.
 * @param props.name     - The setting key or module slug.
 * @param props.label    - The toggle's label.
 * @param props.help     - Optional help text.
 * @param props.disabled - Whether the toggle is unavailable.
 * @return The toggle.
 */
export default function SettingToggle( { data, name, label, help, disabled = false }: Props ) {
	const { save } = data;
	const onChange = useCallback( ( value: boolean ) => save( { [ name ]: value } ), [ save, name ] );

	return (
		<SwitchControl
			label={ label }
			description={ help }
			checked={ Boolean( data.settings?.[ name ] ) }
			disabled={ disabled || data.isSaving( name ) }
			onCheckedChange={ onChange }
		/>
	);
}
