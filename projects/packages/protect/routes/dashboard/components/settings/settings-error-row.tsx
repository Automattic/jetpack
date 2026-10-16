import { Notice } from '@wordpress/ui';
import { CardRow } from '../card';
import type { ProtectSettingsData } from '../../data/use-protect-settings';

/**
 * A card row showing why the last settings change failed, until dismissed.
 *
 * @param props          - Component props.
 * @param props.settings - The settings, with their error.
 * @return The row, or nothing without an error.
 */
export default function SettingsErrorRow( { settings }: { settings: ProtectSettingsData } ) {
	if ( ! settings.error ) {
		return null;
	}

	return (
		<CardRow>
			<Notice.Root intent="error">
				<Notice.Description>{ settings.error }</Notice.Description>
				<Notice.CloseIconButton onClick={ settings.dismissError } />
			</Notice.Root>
		</CardRow>
	);
}
