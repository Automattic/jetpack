/* eslint-disable react/jsx-no-bind */

import { TextControl } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Button, Link, Stack } from '@wordpress/ui';
import { useGoogleVerify } from '../../data/use-google-verify';
import type { FC } from 'react';

interface Props {
	/** The manual Google verification code (meta-tag content). */
	value: string;
	onChange: ( value: string ) => void;
	/** Save the manual code — called on blur (auto-save, no Save button). */
	onCommit?: () => void;
	disabled?: boolean;
}

const manualHelp = __(
	'Paste the "content" attribute from the Google Search Console meta tag.',
	'jetpack-seo'
);

/**
 * Google verification: a WordPress.com keyring auto-verify flow on connected sites,
 * with manual meta-tag entry as a fallback (and the only option when disconnected).
 * The other services stay simple code fields in the parent card.
 *
 * @param props          - Component props.
 * @param props.value    - The manual Google verification code.
 * @param props.onChange - Update the manual code locally.
 * @param props.onCommit - Save the manual code (on blur).
 * @param props.disabled - Whether the controls are disabled.
 * @return The Google verification controls.
 */
const GoogleVerificationField: FC< Props > = ( { value, onChange, onCommit, disabled } ) => {
	// `onCodeSaved` mirrors the auto-verified code into the form's local state so the
	// card's "configured" badge stays in sync without a reload (the hook already
	// persisted it, so this only updates local state — no extra save).
	const { state, isConnected, isOwner, searchConsoleUrl, isVerifying, autoVerify } =
		useGoogleVerify( { onCodeSaved: onChange } );
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
		<TextControl
			label={ __( 'Google verification code', 'jetpack-seo' ) }
			value={ value }
			onChange={ onChange }
			onBlur={ onCommit }
			help={ manualHelp }
			disabled={ disabled }
			__next40pxDefaultSize
			__nextHasNoMarginBottom
		/>
	);

	// Manual entry only when there is no keyring auto-verify path: a disconnected
	// self-hosted site (no popup), or a site where the status check came back
	// `unavailable` (e.g. a `forbidden` response on an under-construction site).
	if ( ! isConnected || state === 'unavailable' ) {
		return (
			<div className="jetpack-seo-settings__google-verification">
				<TextControl
					label={ __( 'Google', 'jetpack-seo' ) }
					value={ value }
					onChange={ onChange }
					onBlur={ onCommit }
					help={ manualHelp }
					disabled={ disabled }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
			</div>
		);
	}

	return (
		<Stack direction="column" gap="md" className="jetpack-seo-settings__google-verification">
			<Stack direction="row" justify="space-between" align="center" gap="sm">
				<strong>{ __( 'Google', 'jetpack-seo' ) }</strong>
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
