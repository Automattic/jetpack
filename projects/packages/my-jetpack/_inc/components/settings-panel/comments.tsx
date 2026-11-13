import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { InputControl, Link, Stack, SwitchControl, Text } from '@wordpress/ui';
import { useCallback, useId, useState } from 'react';
import { PanelModuleToggle } from './panel-module-toggle';
import styles from './styles.module.scss';
import { useModuleOption, useModuleSetting } from './use-module-option';
import type { ModuleSettingsProps } from './registry';

/**
 * The Comments options.
 *
 * @param props          - Component props.
 * @param props.module   - The module.
 * @param props.disabled - Whether the site cannot use the module.
 * @return The settings.
 */
export function CommentsSettings( { module: $module, disabled }: ModuleSettingsProps ) {
	const blocks = useModuleOption( $module, 'enable_blocks_comments' );
	const prompt = useModuleSetting( $module, 'highlander_comment_form_prompt', v =>
		String( v ?? '' )
	);
	// The introduction as typed, until it is saved; null shows the stored one.
	const [ draft, setDraft ] = useState< string | null >( null );
	const optionsDisabled = ! $module.activated || disabled;
	const labelId = useId();
	// Jetpack versions without block comments do not send the option.
	const blocksAvailable =
		! Array.isArray( $module.options ) && undefined !== $module.options?.enable_blocks_comments;

	const { value: storedPrompt, setValue: savePrompt } = prompt;
	// Saved on blur.
	const onBlur = useCallback( async () => {
		if ( draft === null || draft === storedPrompt ) {
			return;
		}
		if ( await savePrompt( draft ) ) {
			setDraft( null );
		}
	}, [ draft, storedPrompt, savePrompt ] );

	return (
		<Stack direction="column" gap="lg">
			<Text variant="body-md">
				{ __(
					'Replace the standard WordPress comment form with one that lets readers comment with their social media accounts.',
					'jetpack-my-jetpack'
				) }
			</Text>
			<Link
				href={ getRedirectUrl( 'jetpack-support-comments' ) }
				target="_blank"
				rel="noopener noreferrer"
			>
				{ __( 'Learn more about Comments', 'jetpack-my-jetpack' ) }
			</Link>

			<Stack
				direction="row"
				align="center"
				justify="space-between"
				className={ styles[ 'settings-panel__toggle' ] }
			>
				<Text variant="body-md" id={ labelId }>
					{ __( 'Use the Jetpack comment form', 'jetpack-my-jetpack' ) }
				</Text>
				<PanelModuleToggle module={ $module } labelledby={ labelId } disabled={ disabled } />
			</Stack>

			{ blocksAvailable && (
				<SwitchControl
					label={ __( 'Enable blocks in comments', 'jetpack-my-jetpack' ) }
					checked={ blocks.value }
					disabled={ optionsDisabled || blocks.isSaving }
					onCheckedChange={ blocks.setValue }
				/>
			) }
			<InputControl
				label={ __( 'Comment form introduction', 'jetpack-my-jetpack' ) }
				description={ __(
					'A few catchy words to motivate your visitors to comment.',
					'jetpack-my-jetpack'
				) }
				value={ draft ?? storedPrompt }
				onValueChange={ setDraft }
				onBlur={ onBlur }
				disabled={ optionsDisabled || prompt.isSaving }
			/>
		</Stack>
	);
}
