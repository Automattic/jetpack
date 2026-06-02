/* eslint-disable react/jsx-no-bind */

import { TextControl } from '@wordpress/components';
import { __, sprintf, _n } from '@wordpress/i18n';
import { Badge, Card, CollapsibleCard, Stack } from '@wordpress/ui';
import './style.scss';
import type { SettingsResponse, VerificationKey } from '../../data/settings-types';
import type { FC } from 'react';

interface Props {
	value: SettingsResponse[ 'verification' ];
	onChange: ( key: VerificationKey, value: string ) => void;
	/** Save the current value — called on blur (auto-save, no Save button). */
	onCommit?: () => void;
	disabled?: boolean;
}

const services: Array< { key: VerificationKey; label: string; hint: string } > = [
	{
		key: 'google',
		label: 'Google',
		hint: __(
			'Paste the `content` attribute from the Google Search Console meta tag.',
			'jetpack-seo'
		),
	},
	{ key: 'bing', label: 'Bing', hint: __( 'Bing Webmaster Tools meta tag.', 'jetpack-seo' ) },
	{ key: 'pinterest', label: 'Pinterest', hint: __( 'Pinterest meta tag.', 'jetpack-seo' ) },
	{ key: 'yandex', label: 'Yandex', hint: __( 'Yandex Webmaster meta tag.', 'jetpack-seo' ) },
	{
		key: 'facebook',
		label: 'Facebook',
		hint: __( 'Facebook domain verification meta tag.', 'jetpack-seo' ),
	},
];

const notSetLabel = __( 'Not set', 'jetpack-seo' );

const VerificationCard: FC< Props > = ( { value, onChange, onCommit, disabled } ) => {
	const verifiedCount = services.filter( ( { key } ) => !! value[ key ] ).length;

	return (
		<CollapsibleCard.Root defaultOpen={ false }>
			<CollapsibleCard.Header>
				<Stack direction="row" justify="space-between" align="center" gap="sm">
					<Card.Title>{ __( 'Site verification', 'jetpack-seo' ) }</Card.Title>
					<Badge intent={ verifiedCount > 0 ? 'stable' : 'draft' }>
						{ verifiedCount > 0
							? sprintf(
									/* translators: %d: number of verification services configured */
									_n( '%d verified', '%d verified', verifiedCount, 'jetpack-seo' ),
									verifiedCount
							  )
							: notSetLabel }
					</Badge>
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<div className="jetpack-seo-settings__verification-grid">
					{ services.map( ( { key, label, hint } ) => (
						<TextControl
							key={ key }
							label={ label }
							value={ value[ key ] }
							onChange={ next => onChange( key, next ) }
							onBlur={ onCommit }
							help={ hint }
							disabled={ disabled }
							__next40pxDefaultSize
							__nextHasNoMarginBottom
						/>
					) ) }
				</div>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default VerificationCard;
