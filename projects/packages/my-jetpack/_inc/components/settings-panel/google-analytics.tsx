import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import {
	Link,
	Notice,
	Spinner,
	Stack,
	SwitchControl,
	Text,
	ValidatedInputControl,
} from '@wordpress/ui';
import { useCallback, useState } from 'react';
import { useGoogleAnalyticsSettings } from './use-google-analytics-settings';
import { useSettingsPanelTracking } from './use-settings-panel-tracking';
import type { GoogleAnalyticsSettings as Settings } from './use-google-analytics-settings';
import type { ChangeEvent } from 'react';

// Empty, or a Universal Analytics or GA4 Measurement ID; the route checks the same.
const CODE_PATTERN = /^(|UA-\d+-\d+|G-[A-Z0-9]+)$/i;

/**
 * The built-in Google Analytics setup: the switch, the Measurement ID and IP anonymization.
 *
 * @return The settings.
 */
export function GoogleAnalyticsSettings() {
	const { settings, isError, isSaving, save } = useGoogleAnalyticsSettings();
	const { trackSettingToggle } = useSettingsPanelTracking( 'google-analytics' );
	// The ID as typed, until it is saved; null shows the stored one.
	const [ draft, setDraft ] = useState< string | null >( null );

	const onSwitch = useCallback(
		( setting: 'is_active' | 'anonymize_ip' ) => ( checked: boolean ) => {
			trackSettingToggle( setting, checked );
			save( { [ setting ]: checked } as Partial< Settings > );
		},
		[ save, trackSettingToggle ]
	);

	const onChange = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => setDraft( event.target.value ),
		[]
	);

	const code = draft ?? settings?.code ?? '';
	const isValid = CODE_PATTERN.test( code.trim() );

	// Saved on blur, like the other text settings in the panel.
	const onBlur = useCallback( async () => {
		const value = code.trim();
		if ( draft === null || ! isValid || value === settings?.code ) {
			return;
		}
		if ( await save( { code: value } ) ) {
			setDraft( null );
		}
	}, [ code, draft, isValid, save, settings?.code ] );

	if ( isError ) {
		return (
			<Notice.Root intent="warning">
				<Notice.Description>
					{ __( 'Failed to get feature settings', 'jetpack-my-jetpack' ) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	if ( ! settings ) {
		return <Spinner />;
	}

	const optionsDisabled = ! settings.is_active || isSaving;

	return (
		<Stack direction="column" gap="lg">
			<Text variant="body-md">
				{ __(
					'Google Analytics is a free service that complements Jetpack Stats with different insights into your traffic.',
					'jetpack-my-jetpack'
				) }
			</Text>
			<Link
				href={ getRedirectUrl( 'wpcom-support-google-analytics' ) }
				target="_blank"
				rel="noopener noreferrer"
			>
				{ __( 'Learn more about Google Analytics', 'jetpack-my-jetpack' ) }
			</Link>

			<SwitchControl
				label={ __( 'Enable Google Analytics', 'jetpack-my-jetpack' ) }
				checked={ settings.is_active }
				disabled={ isSaving }
				onCheckedChange={ onSwitch( 'is_active' ) }
			/>
			<ValidatedInputControl
				label={ __( 'Google Analytics Measurement ID', 'jetpack-my-jetpack' ) }
				description={ __( 'Starts with G-, or UA- for older properties.', 'jetpack-my-jetpack' ) }
				placeholder="G-XXXXXXX"
				value={ code }
				onChange={ onChange }
				onBlur={ onBlur }
				disabled={ optionsDisabled }
				customValidity={
					isValid
						? undefined
						: {
								type: 'invalid',
								message: __( 'Enter a Measurement ID, such as G-XXXXXXX.', 'jetpack-my-jetpack' ),
							}
				}
			/>
			<SwitchControl
				label={ __( 'Anonymize IP addresses', 'jetpack-my-jetpack' ) }
				description={ __(
					'Enabling this option is mandatory in certain countries due to national privacy laws.',
					'jetpack-my-jetpack'
				) }
				checked={ settings.anonymize_ip }
				disabled={ optionsDisabled }
				onCheckedChange={ onSwitch( 'anonymize_ip' ) }
			/>
		</Stack>
	);
}
