import { __ } from '@wordpress/i18n';
import { Button, InputControl, Stack, TextareaControl } from '@wordpress/ui';
import { useCallback, useState } from 'react';
import type { AdsOption } from '../../data/use-ads-settings';

interface TextOptionProps {
	name: AdsOption;
	label: string;
	value: string;
	disabled: boolean;
	isSaving: boolean;
	onSave: ( name: AdsOption, value: string ) => void;
	multiline?: boolean;
	hideLabelFromVision?: boolean;
	placeholder?: string;
	description?: string;
}

/**
 * A text option that saves with its own button, as the Settings card saved its form.
 *
 * @param props                     - Component props.
 * @param props.name                - The option name.
 * @param props.label               - The field label.
 * @param props.value               - The stored value.
 * @param props.disabled            - Whether the option can't change now.
 * @param props.isSaving            - Whether its save is running.
 * @param props.onSave              - Saves the option.
 * @param props.multiline           - A textarea instead of a URL input.
 * @param props.hideLabelFromVision - Keep the label for screen readers only.
 * @param props.placeholder         - The field placeholder.
 * @param props.description         - Plain-text help below the field.
 * @return The field and its Save button.
 */
export function TextOption( {
	name,
	label,
	value,
	disabled,
	isSaving,
	onSave,
	multiline = false,
	hideLabelFromVision = false,
	placeholder,
	description,
}: TextOptionProps ) {
	const [ draft, setDraft ] = useState( value );

	const save = useCallback( () => onSave( name, draft ), [ name, draft, onSave ] );

	const field = {
		label,
		hideLabelFromVision,
		description,
		placeholder,
		value: draft,
		disabled: disabled || isSaving,
		onValueChange: setDraft,
	};

	return (
		<Stack direction="column" gap="sm">
			{ multiline ? (
				<TextareaControl { ...field } rows={ 6 } />
			) : (
				<InputControl { ...field } type="url" />
			) }
			<div>
				<Button
					variant="outline"
					size="compact"
					disabled={ disabled || draft === value }
					loading={ isSaving }
					onClick={ save }
				>
					{ __( 'Save', 'jetpack-monetize' ) }
				</Button>
			</div>
		</Stack>
	);
}
