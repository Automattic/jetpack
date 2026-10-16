import { Notice } from '@wordpress/ui';
import { CardRow } from '../card';
import type { ProtectSettingsData } from '../../data/use-protect-settings';

/**
 * A card row showing why the last save of one of the card's settings failed, until dismissed.
 *
 * @param props          - Component props.
 * @param props.settings - The settings, with their error.
 * @param props.keys     - The settings this card saves.
 * @return The row, or nothing without an error from one of `keys`.
 */
export default function SettingsErrorRow( {
	settings,
	keys,
}: {
	settings: ProtectSettingsData;
	keys: string[];
} ) {
	if ( ! settings.error || ! settings.errorKeys.some( key => keys.includes( key ) ) ) {
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
