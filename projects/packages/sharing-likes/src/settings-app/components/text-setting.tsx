import { TextControl } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Stack } from '@wordpress/ui';
import { useSettings } from '../data/queries';
import { useSaveSetting } from '../data/use-save-setting';
import { useUnsavedChangesWarning } from '../hooks/use-unsaved-changes-warning';
import { BoxRow } from './section-box';
import type { FormEvent, JSX } from 'react';

type TextKey = 'sharing_label' | 'twitter_site_tag';

/**
 * A text setting with its own Save button, so typing never saves half a word.
 *
 * @param props            - Props.
 * @param props.settingKey - Setting.
 * @param props.label      - Field label.
 * @param props.help       - Help text.
 * @return Field, or null when the setting is not offered.
 */
export function TextSetting( {
	settingKey,
	label,
	help,
}: {
	settingKey: TextKey;
	label: string;
	help?: string;
} ): JSX.Element | null {
	const settings = useSettings();
	const save = useSaveSetting();
	const saved = settings?.[ settingKey ] ?? '';
	// Null follows the stored value; a string is the user's own text until a save lands.
	const [ draft, setDraft ] = useState< string | null >( null );
	const [ isSaving, setIsSaving ] = useState( false );
	const value = draft ?? saved;

	const isDirty = draft !== null && draft !== saved;
	useUnsavedChangesWarning( isDirty );

	const handleSave = useCallback( async () => {
		const submitted = value;
		setIsSaving( true );
		const result = await save( settingKey, submitted );
		setIsSaving( false );
		// Show what the server stored, unless the user typed on during the request.
		if ( result ) {
			setDraft( current => ( current === submitted ? null : current ) );
		}
	}, [ save, settingKey, value ] );

	const handleSubmit = useCallback(
		( event: FormEvent ) => {
			event.preventDefault();
			if ( isDirty && ! isSaving ) {
				handleSave();
			}
		},
		[ handleSave, isDirty, isSaving ]
	);

	if ( ! settings || ! ( settingKey in settings ) ) {
		return null;
	}

	return (
		<BoxRow>
			<form onSubmit={ handleSubmit }>
				<Stack direction="column" gap="md" align="start">
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ label }
						help={ help }
						value={ value }
						onChange={ setDraft }
					/>
					<Button type="submit" variant="outline" disabled={ ! isDirty } loading={ isSaving }>
						{ __( 'Save', 'jetpack-sharing-likes' ) }
					</Button>
				</Stack>
			</form>
		</BoxRow>
	);
}
