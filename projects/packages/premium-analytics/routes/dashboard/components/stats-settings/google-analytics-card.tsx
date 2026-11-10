import {
	useGoogleAnalyticsSettings,
	type GoogleAnalyticsSettings,
} from '@jetpack-premium-analytics/data';
import {
	Card,
	InputControl,
	Link,
	Notice,
	Spinner,
	Stack,
	SwitchControl,
	Text,
} from '@jetpack-premium-analytics/externals';
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { getSiteErrorMessage } from './site-error-message';
import type { JSX } from 'react';

const SUPPORT_URL = 'https://wordpress.com/support/google-analytics/';

// The IDs the site accepts: a GA4 Measurement ID, a legacy UA ID, or nothing.
const CODE_PATTERN = /^(|UA-\d+-\d+|G-[A-Z0-9]+)$/i;

/**
 * The Google Analytics card: the switches save at once, the Measurement ID on blur.
 *
 * @return The card.
 */
export function GoogleAnalyticsCard(): JSX.Element {
	const { settings, isError, saveChange } = useGoogleAnalyticsSettings();
	const trackEvent = useTrackEvent();
	const { createSuccessNotice, createErrorNotice } = useDispatch( 'core/notices' );
	const [ draft, setDraft ] = useState< string | null >( null );
	const [ saving, setSaving ] = useState( false );

	const save = useCallback(
		async ( values: Partial< GoogleAnalyticsSettings > ) => {
			setSaving( true );
			try {
				await saveChange( values );
			} catch ( error ) {
				const reason = getSiteErrorMessage( error );
				createErrorNotice(
					reason
						? sprintf(
								/* translators: %s: the reason the site gave. */
								__(
									'Your Google Analytics settings could not be saved: %s',
									'jetpack-premium-analytics-pkg'
								),
								reason
							)
						: __(
								'Your Google Analytics settings could not be saved.',
								'jetpack-premium-analytics-pkg'
							),
					{ id: 'google-analytics-save-failed', type: 'snackbar' }
				);
				return false;
			} finally {
				setSaving( false );
			}
			createSuccessNotice( __( 'Settings saved.', 'jetpack-premium-analytics-pkg' ), {
				id: 'stats-settings-saved',
				type: 'snackbar',
			} );
			return true;
		},
		[ createErrorNotice, createSuccessNotice, saveChange ]
	);

	const onToggle = useCallback(
		( setting: 'is_active' | 'anonymize_ip' ) => ( enabled: boolean ) => {
			save( { [ setting ]: enabled } ).then( saved => {
				if ( saved ) {
					trackEvent( 'jetpack_premium_analytics_settings_changed', {
						setting: `google_analytics_${ setting }`,
						enabled,
					} );
				}
			} );
		},
		[ save, trackEvent ]
	);

	const code = draft ?? settings?.code ?? '';
	const isValid = CODE_PATTERN.test( code.trim() );
	// The tab saves as it goes, so the ID saves on blur rather than with its own button.
	const onCodeBlur = useCallback( () => {
		const next = code.trim();
		if ( ! isValid || next === settings?.code ) {
			return;
		}
		save( { code: next } ).then( saved => saved && setDraft( null ) );
	}, [ code, isValid, save, settings?.code ] );

	let content: JSX.Element;
	if ( settings ) {
		content = (
			<Stack direction="column" gap="lg">
				<Text>
					{ __(
						'Google Analytics is a free service that complements Jetpack Stats with different insights into your traffic.',
						'jetpack-premium-analytics-pkg'
					) }{ ' ' }
					<Link href={ SUPPORT_URL } openInNewTab>
						{ __( 'Learn more', 'jetpack-premium-analytics-pkg' ) }
					</Link>
				</Text>
				<SwitchControl
					label={ __( 'Enable Google Analytics', 'jetpack-premium-analytics-pkg' ) }
					checked={ settings.is_active }
					disabled={ saving }
					onCheckedChange={ onToggle( 'is_active' ) }
				/>
				{ settings.is_active && (
					<>
						<InputControl
							label={ __( 'Google Analytics Measurement ID', 'jetpack-premium-analytics-pkg' ) }
							placeholder="G-XXXXXXX"
							value={ code }
							disabled={ saving }
							onValueChange={ setDraft }
							onBlur={ onCodeBlur }
							description={
								isValid
									? undefined
									: __(
											'Enter a Measurement ID, such as G-XXXXXXX.',
											'jetpack-premium-analytics-pkg'
										)
							}
						/>
						<SwitchControl
							label={ __( 'Anonymize IP addresses', 'jetpack-premium-analytics-pkg' ) }
							description={ __(
								'Enabling this option is mandatory in certain countries due to national privacy laws.',
								'jetpack-premium-analytics-pkg'
							) }
							checked={ settings.anonymize_ip }
							disabled={ saving }
							onCheckedChange={ onToggle( 'anonymize_ip' ) }
						/>
					</>
				) }
			</Stack>
		);
	} else if ( isError ) {
		content = (
			<Notice.Root intent="error">
				<Notice.Description>
					{ __(
						'Your Google Analytics settings could not be loaded. Reload the page to try again.',
						'jetpack-premium-analytics-pkg'
					) }
				</Notice.Description>
			</Notice.Root>
		);
	} else {
		content = <Spinner />;
	}

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Google Analytics', 'jetpack-premium-analytics-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>{ content }</Card.Content>
		</Card.Root>
	);
}
