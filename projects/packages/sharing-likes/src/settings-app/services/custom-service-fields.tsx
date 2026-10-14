import { TextControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import type { CustomServiceFields as Fields } from '../types';
import type { JSX } from 'react';

export const EMPTY_CUSTOM_SERVICE: Fields = { name: '', url: '', icon: '' };

const PLACEHOLDERS = [
	'%post_id%',
	'%post_title%',
	'%post_slug%',
	'%post_url%',
	'%post_full_url%',
	'%post_excerpt%',
	'%post_tags%',
	'%home_url%',
];

/**
 * Whether the server would accept the fields: it refuses a service missing any of them.
 *
 * @param fields - Fields.
 * @return Whether all three are filled in.
 */
export function isComplete( fields: Fields ): boolean {
	return !! ( fields.name.trim() && fields.url.trim() && fields.icon.trim() );
}

/**
 * Name, sharing URL and icon URL of a custom service.
 *
 * @param props          - Props.
 * @param props.values   - Current values.
 * @param props.onChange - Called with the new values.
 * @return Fields.
 */
export function CustomServiceFields( {
	values,
	onChange,
}: {
	values: Fields;
	onChange: ( values: Fields ) => void;
} ): JSX.Element {
	const setName = useCallback(
		( name: string ) => onChange( { ...values, name } ),
		[ onChange, values ]
	);
	const setUrl = useCallback(
		( url: string ) => onChange( { ...values, url } ),
		[ onChange, values ]
	);
	const setIcon = useCallback(
		( icon: string ) => onChange( { ...values, icon } ),
		[ onChange, values ]
	);

	return (
		<Stack direction="column" gap="lg">
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Service name', 'jetpack-sharing-likes' ) }
				value={ values.name }
				onChange={ setName }
			/>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				type="url"
				label={ __( 'Sharing URL', 'jetpack-sharing-likes' ) }
				help={
					<>
						{ __(
							'You can add the following variables to your service sharing URL:',
							'jetpack-sharing-likes'
						) }{ ' ' }
						{ PLACEHOLDERS.map( ( placeholder, index ) => (
							<span key={ placeholder }>
								{ index > 0 && ', ' }
								<code>{ placeholder }</code>
							</span>
						) ) }
					</>
				}
				value={ values.url }
				onChange={ setUrl }
			/>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				type="url"
				label={ __( 'Icon URL', 'jetpack-sharing-likes' ) }
				help={ __(
					'Enter the URL of a 16x16px icon you want to use for this service.',
					'jetpack-sharing-likes'
				) }
				value={ values.icon }
				onChange={ setIcon }
			/>
		</Stack>
	);
}
