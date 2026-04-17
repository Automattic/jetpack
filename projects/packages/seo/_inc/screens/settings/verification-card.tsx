/* eslint-disable react/jsx-no-bind */

import { TextControl } from '@wordpress/components';
import { __, sprintf, _n } from '@wordpress/i18n';
import { Badge, Card, CollapsibleCard, Stack } from '@wordpress/ui';
import styles from './style.module.scss';
import type { SettingsResponse, VerificationKey } from '../../data/settings-types';
import type { FC } from 'react';

interface Props {
	value: SettingsResponse[ 'verification' ];
	onChange: ( key: VerificationKey, value: string ) => void;
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

const VerificationCard: FC< Props > = ( { value, onChange, disabled } ) => {
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
							: __( 'Not set', 'jetpack-seo' ) }
					</Badge>
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<div className={ styles.verificationGrid }>
					{ services.map( ( { key, label, hint } ) => (
						<TextControl
							key={ key }
							label={ label }
							value={ value[ key ] }
							onChange={ next => onChange( key, next ) }
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
