/* eslint-disable react/jsx-no-bind */
// PROTOTYPE (JPPROD-116): throwaway Bing copy of `google-verification-field`.

import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Button, InputControl, Link, Stack, Text } from '@wordpress/ui';
import { useBingVerify } from '../../data/use-bing-verify';
import type { FC } from 'react';

interface Props {
	value: string;
	onChange: ( value: string ) => void;
	saveCode: ( code: string ) => Promise< void >;
	onCommit?: () => void;
	disabled?: boolean;
}

const GROUP_LABEL_ID = 'jetpack-seo-settings-bing-verification-label';

const manualHelp = __(
	'Paste the verification tag from Bing Webmaster Tools, or just the code inside it.',
	'jetpack-seo'
);

/**
 * Offer the host's Bing connect flow with manual code entry as a fallback.
 *
 * @param props          - Component props.
 * @param props.value    - The manual Bing verification code.
 * @param props.onChange - Update the manual code locally.
 * @param props.saveCode - Save the code the connect flow fetches.
 * @param props.onCommit - Save the manual code (on blur).
 * @param props.disabled - Whether the controls are disabled.
 * @return The Bing verification controls.
 */
const BingVerificationField: FC< Props > = ( {
	value,
	onChange,
	saveCode,
	onCommit,
	disabled,
} ) => {
	const {
		state,
		canAutoVerify,
		isOwner,
		webmasterToolsUrl,
		isVerifying,
		isConfirming,
		autoVerify,
	} = useBingVerify( { saveCode } );
	const [ manualOpen, setManualOpen ] = useState( false );
	const manualVisible = manualOpen || !! value;

	useEffect( () => {
		if ( value ) {
			setManualOpen( true );
		}
	}, [ value ] );

	if ( ! canAutoVerify || state === 'unavailable' ) {
		return (
			<InputControl
				label={ __( 'Bing', 'jetpack-seo' ) }
				value={ value }
				onValueChange={ onChange }
				onBlur={ onCommit }
				description={ manualHelp }
				disabled={ disabled }
			/>
		);
	}

	return (
		<Stack direction="column" gap="md" role="group" aria-labelledby={ GROUP_LABEL_ID }>
			<Stack direction="row" justify="space-between" align="center" gap="sm">
				<Text variant="heading-sm" render={ <span /> } id={ GROUP_LABEL_ID }>
					{ __( 'Bing', 'jetpack-seo' ) }
				</Text>
				{ state === 'verified' && (
					<Badge intent="stable">{ __( 'Verified', 'jetpack-seo' ) }</Badge>
				) }
				{ state === 'unverified' && (
					<Badge intent="draft">{ __( 'Not verified', 'jetpack-seo' ) }</Badge>
				) }
			</Stack>

			{ state === 'verified' && isOwner && !! webmasterToolsUrl && (
				<Link href={ webmasterToolsUrl } openInNewTab rel="noopener noreferrer">
					{ __( 'View in Bing Webmaster Tools', 'jetpack-seo' ) }
				</Link>
			) }

			{ state !== 'verified' && (
				<Stack direction="row" gap="sm" align="center">
					<Button
						onClick={ autoVerify }
						loading={ isVerifying }
						disabled={ disabled || isVerifying || state === 'loading' }
					>
						{ __( 'Connect Bing', 'jetpack-seo' ) }
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

			{ state !== 'verified' && manualVisible && (
				<InputControl
					label={ __( 'Bing verification code', 'jetpack-seo' ) }
					value={ value }
					onValueChange={ onChange }
					onBlur={ onCommit }
					description={ manualHelp }
					disabled={ disabled || isConfirming }
				/>
			) }
		</Stack>
	);
};

export default BingVerificationField;
