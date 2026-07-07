/* eslint-disable react/jsx-no-bind */

import { TextControl } from '@wordpress/components';
import { __, sprintf, _n } from '@wordpress/i18n';
import { Badge, Card, CollapsibleCard, Stack } from '@wordpress/ui';
import { VERIFICATION_SERVICES } from '../../data/verification-services';
import GoogleVerificationField from './google-verification-field';
import './style.scss';
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

// Per-service input hints, keyed by the shared service id. The service list and
// brand labels live in `data/verification-services` (single source of truth).
const HINTS: Record< VerificationKey, string > = {
	google: __(
		'Paste the "content" attribute from the Google Search Console meta tag.',
		'jetpack-seo'
	),
	bing: __( 'Bing Webmaster Tools meta tag.', 'jetpack-seo' ),
	pinterest: __( 'Pinterest meta tag.', 'jetpack-seo' ),
	yandex: __( 'Yandex Webmaster meta tag.', 'jetpack-seo' ),
	facebook: __( 'Facebook domain verification meta tag.', 'jetpack-seo' ),
};

const notSetLabel = __( 'Not set', 'jetpack-seo' );

const VerificationCard: FC< Props > = ( {
	value,
	onChange,
	onCommit,
	disabled,
	open,
	onOpenChange,
} ) => {
	const verifiedCount = VERIFICATION_SERVICES.filter( ( { key } ) => !! value[ key ] ).length;

	// CollapsibleCard.Root takes either controlled (`open`/`onOpenChange`) or
	// uncontrolled (`defaultOpen`) props — one at a time.
	const collapsibleProps = open === undefined ? { defaultOpen: false } : { open, onOpenChange };

	return (
		<CollapsibleCard.Root { ...collapsibleProps }>
			<CollapsibleCard.Header>
				<Stack direction="row" justify="space-between" align="center" gap="sm">
					<Card.Title>{ __( 'Site verification', 'jetpack-seo' ) }</Card.Title>
					<Badge intent={ verifiedCount > 0 ? 'stable' : 'draft' }>
						{ verifiedCount > 0
							? sprintf(
									/* translators: %d: number of verification services configured */
									_n( '%d set', '%d set', verifiedCount, 'jetpack-seo' ),
									verifiedCount
							  )
							: notSetLabel }
					</Badge>
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Stack direction="column" gap="lg">
					{ /* Google gets the keyring auto-verify flow; the rest are simple code fields. */ }
					<GoogleVerificationField
						value={ value.google }
						onChange={ next => onChange( 'google', next ) }
						onCommit={ onCommit }
						disabled={ disabled }
					/>
					<div className="jetpack-seo-settings__verification-grid">
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
					</div>
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default VerificationCard;
