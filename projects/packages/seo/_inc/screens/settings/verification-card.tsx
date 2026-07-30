/* eslint-disable react/jsx-no-bind */

import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';
import { Card, CollapsibleCard, Stack, Text } from '@wordpress/ui';
import CardTitleIcon from '../../components/card-title-icon';
import StatusIndicator from '../../components/status-indicator';
import { VERIFICATION_SERVICES } from '../../data/verification-services';
import GoogleVerificationField from './google-verification-field';
import styles from './style.module.scss';
import type { SettingStatus } from '../../components/status-indicator';
import type { SettingsResponse, VerificationKey } from '../../data/settings-types';
import type { FC } from 'react';

interface Props {
	value: SettingsResponse[ 'verification' ];
	onChange: ( key: VerificationKey, value: string ) => void;
	/** Save the current value — called on blur (auto-save, no Save button). */
	onCommit?: () => void;
	disabled?: boolean;
	/** Controlled open state — lets a deep link expand the card. Uncontrolled (collapsed) when omitted. */
	open?: boolean;
	onOpenChange?: ( open: boolean ) => void;
}

const description = __(
	"Confirm you own this site to unlock each service's own tools, like Google Search Console, for tracking performance and submitting your sitemap.",
	'jetpack-seo'
);

// Per-service input hints, keyed by the shared service id. The service list and
// brand labels live in `data/verification-services` (single source of truth).
//
// Each hint names where to fetch the tag and says both forms are accepted. This
// page saves through `/jetpack/v4/settings`, which validates the value
// (`validate_verification_service()`) and stores it; the code is unwrapped from a
// pasted tag on the way in (`class.jetpack-core-api-module-endpoints.php`) and
// again at render (`jetpack_verification_print_meta()`). Both unwrappers expect
// the `<meta name="…" content="…" />` shape the services actually emit.
// Deliberately not repeating each service's own name for the tag ("HTML tag",
// "HTML Meta Tag", …): those are third-party UI labels that drift out of date.
//
// Google is absent by design — its field is the keyring component below, which
// carries its own hint.
const HINTS: Record< Exclude< VerificationKey, 'google' >, string > = {
	bing: __(
		'Paste the verification tag from Bing Webmaster Tools, or just the code inside it.',
		'jetpack-seo'
	),
	pinterest: __(
		'Paste the verification tag from Pinterest, or just the code inside it.',
		'jetpack-seo'
	),
	yandex: __(
		'Paste the verification tag from Yandex Webmaster, or just the code inside it.',
		'jetpack-seo'
	),
	facebook: __(
		'Paste the domain verification tag from Meta Business, or just the code inside it.',
		'jetpack-seo'
	),
};

const VerificationCard: FC< Props > = ( {
	value,
	onChange,
	onCommit,
	disabled,
	open,
	onOpenChange,
} ) => {
	const verifiedCount = VERIFICATION_SERVICES.filter( ( { key } ) => !! value[ key ] ).length;

	// All five services are optional and almost nobody verifies with more than
	// one, so a single verified service counts as done rather than a fraction of
	// five (JETPACK-2051). This module therefore never reports 'in-progress'.
	const verificationStatus: SettingStatus = verifiedCount > 0 ? 'complete' : 'not-started';

	// CollapsibleCard.Root takes either controlled (`open`/`onOpenChange`) or
	// uncontrolled (`defaultOpen`) props — one at a time.
	const collapsibleProps = open === undefined ? { defaultOpen: false } : { open, onOpenChange };

	return (
		<CollapsibleCard.Root { ...collapsibleProps }>
			<CollapsibleCard.Header render={ <h2 /> }>
				<Stack direction="row" justify="space-between" align="center" gap="sm">
					<Card.Title>
						<CardTitleIcon icon={ check } title={ __( 'Site verification', 'jetpack-seo' ) } />
					</Card.Title>
					<CollapsibleCard.HeaderDescription>
						<StatusIndicator status={ verificationStatus } />
					</CollapsibleCard.HeaderDescription>
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Stack direction="column" gap="lg">
					{ /* `body-sm` + muted matches every other explanatory paragraph on this
					     tab (schema sections, social previews, title structure). */ }
					<Text variant="body-sm" className={ styles.muted } render={ <p /> }>
						{ description }
					</Text>
					{ /* Google gets the keyring auto-verify flow; the rest are simple code fields. */ }
					<GoogleVerificationField
						value={ value.google }
						onChange={ next => onChange( 'google', next ) }
						onCommit={ onCommit }
						disabled={ disabled }
					/>
					<Stack direction="column" gap="md">
						{ VERIFICATION_SERVICES.filter( ( { key } ) => key !== 'google' ).map(
							( { key, label } ) => (
								<TextControl
									key={ key }
									label={ label }
									value={ value[ key ] }
									onChange={ next => onChange( key, next ) }
									onBlur={ onCommit }
									help={ HINTS[ key ] }
									disabled={ disabled }
									__next40pxDefaultSize
									__nextHasNoMarginBottom
								/>
							)
						) }
					</Stack>
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default VerificationCard;
