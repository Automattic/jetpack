/* eslint-disable react/jsx-no-bind */

import { Button, TextControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Link, Stack } from '@wordpress/ui';
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
	const { state, isConnected, isOwner, searchConsoleUrl, isVerifying, autoVerify } =
		useGoogleVerify();
	const [ manualOpen, setManualOpen ] = useState( false );

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

	// Disconnected self-hosted site: no keyring popup, so manual entry only.
	if ( ! isConnected ) {
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
		<Stack direction="column" gap="sm" className="jetpack-seo-settings__google-verification">
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
						variant="primary"
						onClick={ autoVerify }
						isBusy={ isVerifying }
						disabled={ disabled || isVerifying || state === 'loading' }
					>
						{ __( 'Verify with Google', 'jetpack-seo' ) }
					</Button>
					<Button
						variant="tertiary"
						onClick={ () => setManualOpen( current => ! current ) }
						disabled={ disabled }
					>
						{ __( 'Enter a code manually', 'jetpack-seo' ) }
					</Button>
				</Stack>
			) }

			{ /* Reveal the manual field on request, or whenever a code is already set. */ }
			{ state !== 'verified' && ( manualOpen || !! value ) && manualField }
		</Stack>
	);
};

export default GoogleVerificationField;
