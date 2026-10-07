import { TextControl } from '@wordpress/components';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Stack } from '@wordpress/ui';
import { useSettings } from '../data/queries';
import { useSaveSetting } from '../data/use-save-setting';
import { useUnsavedChangesWarning } from '../hooks/use-unsaved-changes-warning';
import type { JSX } from 'react';

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
	const [ draft, setDraft ] = useState( saved );
	const [ isSaving, setIsSaving ] = useState( false );
	const lastSaved = useRef( saved );

	// Follow the stored value while the user has nothing of their own in the field.
	useEffect( () => {
		setDraft( current => ( current === lastSaved.current ? saved : current ) );
		lastSaved.current = saved;
	}, [ saved ] );

	const isDirty = draft !== saved;
	useUnsavedChangesWarning( isDirty );

	const handleSave = useCallback( async () => {
		setIsSaving( true );
		const result = await save( settingKey, draft );
		setIsSaving( false );
		if ( result ) {
			setDraft( result[ settingKey ] ?? '' );
		}
	}, [ draft, save, settingKey ] );

	if ( ! settings || ! ( settingKey in settings ) ) {
		return null;
	}

	return (
		<Stack direction="row" gap="sm" align="end">
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ label }
				help={ help }
				value={ draft }
				onChange={ setDraft }
			/>
			<Button
				variant="solid"
				disabled={ ! isDirty }
				focusableWhenDisabled={ false }
				loading={ isSaving }
				onClick={ handleSave }
			>
				{ __( 'Save', 'jetpack-sharing-likes' ) }
			</Button>
		</Stack>
	);
}
