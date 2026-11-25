/* eslint-disable react/jsx-no-bind */

import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Button, InputControl, Link, Stack, Text } from '@wordpress/ui';
import { useGoogleVerify } from '../../data/use-google-verify';
import type { FC } from 'react';

interface Props {
	/** The manual Google verification code (meta-tag content). */
	value: string;
	onChange: ( value: string ) => void;
	/** Save the code auto-verify fetches, through the settings form. */
	saveCode: ( code: string ) => Promise< void >;
	/** Save the manual code — called on blur (auto-save, no Save button). */
	onCommit?: () => void;
	disabled?: boolean;
}

// Names the auto-verify group for assistive tech. Static, matching the
// `jetpack-seo-settings-*` ids used elsewhere in this folder — there's only ever
// one Google field on the tab, so it can't collide.
const GROUP_LABEL_ID = 'jetpack-seo-settings-google-verification-label';

// Matches the wording of the other services' hints in `verification-card`: both
// a whole pasted meta tag and a bare code are accepted on save.
const manualHelp = __(
	'Paste the verification tag from Google Search Console, or just the code inside it.',
	'jetpack-seo'
);

/**
 * Offer the host's Google verification flow with manual code entry as a fallback.
 *
 * @param props          - Component props.
 * @param props.value    - The manual Google verification code.
 * @param props.onChange - Update the manual code locally.
 * @param props.saveCode - Save the code auto-verify fetches.
 * @param props.onCommit - Save the manual code (on blur).
 * @param props.disabled - Whether the controls are disabled.
 * @return The Google verification controls.
 */
const GoogleVerificationField: FC< Props > = ( {
	value,
	onChange,
	saveCode,
	onCommit,
	disabled,
} ) => {
	const { state, canAutoVerify, isOwner, searchConsoleUrl, isVerifying, isConfirming, autoVerify } =
		useGoogleVerify( { saveCode } );
	const [ manualOpen, setManualOpen ] = useState( false );
	const manualVisible = manualOpen || !! value;

	// Latch the manual field open once a code exists, so clearing the input
	// mid-edit doesn't unmount it from under the cursor.
	useEffect( () => {
		if ( value ) {
			setManualOpen( true );
		}
	}, [ value ] );

	const manualField = (
		<InputControl
			label={ __( 'Google verification code', 'jetpack-seo' ) }
			value={ value }
			onValueChange={ onChange }
			onBlur={ onCommit }
			description={ manualHelp }
			// Locked once the popup returns, so a code typed meanwhile can't save after the token and
			// replace it. Not while the popup is open: a blocked popup never returns.
			disabled={ disabled || isConfirming }
		/>
	);

	// Keep manual entry available when the host lacks or forbids automatic verification.
	if ( ! canAutoVerify || state === 'unavailable' ) {
		return (
			<InputControl
				label={ __( 'Google', 'jetpack-seo' ) }
				value={ value }
				onValueChange={ onChange }
				onBlur={ onCommit }
				description={ manualHelp }
				disabled={ disabled }
			/>
		);
	}

	// Named as a group: unlike the other four services, this branch is a name over
	// several controls (verify, manual entry, and the revealed code field), so it needs
	// to attach to them for a screen reader. The `Text` inside is styled as a field
	// label, which on its own would say "label" without saying what it labels.
	return (
		<Stack direction="column" gap="md" role="group" aria-labelledby={ GROUP_LABEL_ID }>
			<Stack direction="row" justify="space-between" align="center" gap="sm">
				{ /* `heading-sm` matches the 11px uppercase `InputControl` labels of the other
				     services and of this field's manual-entry branch above. */ }
				<Text variant="heading-sm" render={ <span /> } id={ GROUP_LABEL_ID }>
					{ __( 'Google', 'jetpack-seo' ) }
				</Text>
				{ state === 'verified' && (
					<Badge intent="stable">{ __( 'Verified', 'jetpack-seo' ) }</Badge>
				) }
				{ state === 'unverified' && (
					<Badge intent="draft">{ __( 'Not verified', 'jetpack-seo' ) }</Badge>
				) }
			</Stack>

			{ state === 'verified' && isOwner && !! searchConsoleUrl && (
				<Link href={ searchConsoleUrl } openInNewTab rel="noopener noreferrer">
					{ __( 'View in Google Search Console', 'jetpack-seo' ) }
				</Link>
			) }

			{ state !== 'verified' && (
				<Stack direction="row" gap="sm" align="center">
					<Button
						onClick={ autoVerify }
						loading={ isVerifying }
						disabled={ disabled || isVerifying || state === 'loading' }
					>
						{ __( 'Verify with Google', 'jetpack-seo' ) }
					</Button>
					{ ! manualVisible && (
						<Button
							variant="minimal"
							tone="neutral"
							onClick={ () => setManualOpen( true ) }
							disabled={ disabled }
						>
							{ __( 'Enter a code manually', 'jetpack-seo' ) }
						</Button>
					) }
				</Stack>
			) }

			{ /* Reveal the manual field on request, or whenever a code is already set. */ }
			{ state !== 'verified' && manualVisible && manualField }
		</Stack>
	);
};

export default GoogleVerificationField;
