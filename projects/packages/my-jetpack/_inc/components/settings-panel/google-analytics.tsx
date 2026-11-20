import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
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
import { PRODUCT_SLUGS } from '../../data/constants';
import useProduct from '../../data/products/use-product';
import { LearnMoreLink } from './learn-more-link';
import { useGoogleAnalyticsSettings } from './use-google-analytics-settings';
import { useSettingsPanelTracking } from './use-settings-panel-tracking';
import type { GoogleAnalyticsSettings as Settings } from './use-google-analytics-settings';
import type { ChangeEvent } from 'react';

// Empty, or a GA4 Measurement ID; a stored Universal Analytics ID stays valid. The route checks the same.
const CODE_PATTERN = /^(|UA-\d+-\d+|G-[A-Z0-9]+)$/i;

/**
 * The built-in Google Analytics setup: the switch, the Measurement ID and IP anonymization.
 *
 * @return The settings.
 */
export function GoogleAnalyticsSettings() {
	const { settings, isError, isSaving, save } = useGoogleAnalyticsSettings();
	const { trackSettingToggle, trackSettingChange } = useSettingsPanelTracking( 'google-analytics' );
	const { detail: stats } = useProduct( PRODUCT_SLUGS.STATS );
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

	// Saved on blur.
	const onBlur = useCallback( async () => {
		const value = code.trim();
		if ( draft === null || ! isValid || value === settings?.code ) {
			return;
		}
		trackSettingChange( 'code' );
		if ( await save( { code: value } ) ) {
			setDraft( null );
		}
	}, [ code, draft, isValid, save, settings?.code, trackSettingChange ] );

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

	const needsId = settings.is_active && ! settings.code;

	return (
		<Stack direction="column" gap="lg">
			<Text variant="body-md">
				{ createInterpolateElement(
					__(
						'Google Analytics is a free service that complements <a>Jetpack Stats</a> with different insights into your traffic.',
						'jetpack-my-jetpack'
					),
					{ a: stats?.manageUrl ? <Link href={ stats.manageUrl } /> : <></> }
				) }
			</Text>
			<LearnMoreLink
				module="google-analytics"
				href={ getRedirectUrl( 'wpcom-support-google-analytics' ) }
			>
				{ __( 'Learn more about Google Analytics', 'jetpack-my-jetpack' ) }
			</LearnMoreLink>

			<SwitchControl
				label={ __( 'Enable Google Analytics', 'jetpack-my-jetpack' ) }
				checked={ settings.is_active }
				onCheckedChange={ onSwitch( 'is_active' ) }
			/>
			{ needsId && (
				<Notice.Root intent="warning">
					<Notice.Description>
						{ __( 'Add a Measurement ID to start tracking.', 'jetpack-my-jetpack' ) }
					</Notice.Description>
				</Notice.Root>
			) }
			<ValidatedInputControl
				label={ __( 'Google Analytics Measurement ID', 'jetpack-my-jetpack' ) }
				description={ __( 'Starts with G-.', 'jetpack-my-jetpack' ) }
				placeholder="G-XXXXXXX"
				value={ code }
				onChange={ onChange }
				onBlur={ onBlur }
				// Editable while off, so the ID can go in before tracking starts.
				disabled={ isSaving( 'code' ) }
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
				disabled={ ! settings.is_active }
				onCheckedChange={ onSwitch( 'anonymize_ip' ) }
			/>
		</Stack>
	);
}
