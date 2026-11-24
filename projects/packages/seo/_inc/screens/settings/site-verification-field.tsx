/* eslint-disable react/jsx-no-bind */

import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Button, InputControl, Link, Stack, Text } from '@wordpress/ui';
import { useSiteVerify } from '../../data/use-site-verify';
import { VERIFICATION_SERVICES } from '../../data/verification-services';
import type { SiteVerifyService } from '../../data/site-verify-services';
import type { FC } from 'react';

interface Props {
	service: SiteVerifyService;
	/** The manual verification code (meta-tag content). */
	value: string;
	onChange: ( value: string ) => void;
	/** Save the code auto-verify fetches, through the settings form. */
	saveCode: ( code: string ) => Promise< void >;
	/** Save the manual code — called on blur (auto-save, no Save button). */
	onCommit?: () => void;
	disabled?: boolean;
}

/**
 * Offer the host's verification flow for a service, with manual code entry as a fallback.
 *
 * @param props          - Component props.
 * @param props.service  - The verification service.
 * @param props.value    - The manual verification code.
 * @param props.onChange - Update the manual code locally.
 * @param props.saveCode - Save the code auto-verify fetches.
 * @param props.onCommit - Save the manual code (on blur).
 * @param props.disabled - Whether the controls are disabled.
 * @return The verification controls.
 */
const SiteVerificationField: FC< Props > = ( {
	service,
	value,
	onChange,
	saveCode,
	onCommit,
	disabled,
} ) => {
	const { state, canAutoVerify, isOwner, toolsUrl, isVerifying, isConfirming, autoVerify } =
		useSiteVerify( service, { saveCode } );
	const [ manualOpen, setManualOpen ] = useState( false );
	const manualVisible = manualOpen || !! value;
	const { strings } = service;
	const label = VERIFICATION_SERVICES.find( ( { key } ) => key === service.key )?.label ?? '';
	// Names the auto-verify group for assistive tech; one field per service, so it can't collide.
	const groupLabelId = `jetpack-seo-settings-${ service.key }-verification-label`;

	// Latch the manual field open once a code exists, so clearing the input
	// mid-edit doesn't unmount it from under the cursor.
	useEffect( () => {
		if ( value ) {
			setManualOpen( true );
		}
	}, [ value ] );

	const manualField = (
		<InputControl
			label={ strings.codeLabel }
			value={ value }
			onValueChange={ onChange }
			onBlur={ onCommit }
			description={ strings.manualHelp }
			// Locked once the popup returns, so a code typed meanwhile can't save after the token and
			// replace it. Not while the popup is open: a blocked popup never returns.
			disabled={ disabled || isConfirming }
		/>
	);

	// Keep manual entry available when the host lacks or forbids automatic verification.
	if ( ! canAutoVerify || state === 'unavailable' ) {
		return (
			<InputControl
				label={ label }
				value={ value }
				onValueChange={ onChange }
				onBlur={ onCommit }
				description={ strings.manualHelp }
				disabled={ disabled }
			/>
		);
	}

	// Named as a group: unlike the code-only services, this branch is a name over
	// several controls (verify, manual entry, and the revealed code field), so it needs
	// to attach to them for a screen reader. The `Text` inside is styled as a field
	// label, which on its own would say "label" without saying what it labels.
	return (
		<Stack direction="column" gap="md" role="group" aria-labelledby={ groupLabelId }>
			<Stack direction="row" justify="space-between" align="center" gap="sm">
				{ /* `heading-sm` matches the 11px uppercase `InputControl` labels of the other
				     services and of this field's manual-entry branch above. */ }
				<Text variant="heading-sm" render={ <span /> } id={ groupLabelId }>
					{ label }
				</Text>
				{ state === 'verified' && (
					<Badge intent="stable">{ __( 'Verified', 'jetpack-seo' ) }</Badge>
				) }
				{ state === 'unverified' && (
					<Badge intent="draft">{ __( 'Not verified', 'jetpack-seo' ) }</Badge>
				) }
			</Stack>

			{ state === 'verified' && isOwner && !! toolsUrl && (
				<Link href={ toolsUrl } openInNewTab rel="noopener noreferrer">
					{ strings.toolsLink }
				</Link>
			) }

			{ state !== 'verified' && (
				<Stack direction="row" gap="sm" align="center">
					<Button
						onClick={ autoVerify }
						loading={ isVerifying }
						disabled={ disabled || isVerifying || state === 'loading' }
					>
						{ strings.verify }
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

export default SiteVerificationField;
