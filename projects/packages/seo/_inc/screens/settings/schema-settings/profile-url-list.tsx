/* eslint-disable react/jsx-no-bind */

import { Button as WPButton, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { normalizeProfileUrl } from '../../../data/schema-settings-utils';
import styles from './style.module.scss';
import type { FC } from 'react';

interface Props {
	label: string;
	help: string;
	urls: string[];
	onChange: ( urls: string[] ) => void;
	disabled: boolean;
}

export const getProfileUrlErrors = ( urls: string[] ): string[] => {
	const normalizedProfiles = urls.map( normalizeProfileUrl );
	return urls.map( ( profile, index ) => {
		const normalizedProfile = normalizedProfiles[ index ];
		if ( ! profile.trim() ) {
			return '';
		}
		if ( ! normalizedProfile ) {
			return __( 'Enter a valid URL that starts with http:// or https://.', 'jetpack-seo' );
		}
		if ( normalizedProfiles.indexOf( normalizedProfile ) !== index ) {
			return __( 'This profile URL is already listed.', 'jetpack-seo' );
		}
		return '';
	} );
};

export const hasProfileUrlErrors = ( urls: string[] ): boolean =>
	getProfileUrlErrors( urls ).some( Boolean );

const ProfileUrlList: FC< Props > = ( { label, help, urls, onChange, disabled } ) => {
	const profileErrors = getProfileUrlErrors( urls );

	const setUrl = ( index: number, value: string ) => {
		const next = urls.slice();
		next[ index ] = value;
		onChange( next );
	};

	const addProfile = () => onChange( [ ...urls, '' ] );
	const removeProfile = ( index: number ) => onChange( urls.filter( ( _, i ) => i !== index ) );

	return (
		<Stack direction="column" gap="sm">
			<Text variant="heading-sm" className={ styles.fieldLabel }>
				{ label }
			</Text>
			<Text variant="body-sm" className={ styles.muted }>
				{ help }
			</Text>
			{ urls.map( ( profile, index ) => {
				const profileError = profileErrors[ index ];
				return (
					<Stack key={ index } direction="row" gap="sm" align="flex-start" wrap="wrap">
						<div
							className={ clsx( styles.profileInput, {
								[ styles.profileError ]: profileError,
							} ) }
						>
							<TextControl
								label={ __( 'Profile URL', 'jetpack-seo' ) }
								hideLabelFromVision
								type="url"
								placeholder="https://"
								value={ profile }
								onChange={ next => setUrl( index, next ) }
								disabled={ disabled }
								help={ profileError || undefined }
								aria-invalid={ Boolean( profileError ) }
								__next40pxDefaultSize
								__nextHasNoMarginBottom
							/>
						</div>
						<WPButton
							variant="tertiary"
							isDestructive
							onClick={ () => removeProfile( index ) }
							disabled={ disabled }
							__next40pxDefaultSize
						>
							{ __( 'Remove profile', 'jetpack-seo' ) }
						</WPButton>
					</Stack>
				);
			} ) }
			<Stack direction="row">
				<Button variant="outline" tone="neutral" onClick={ addProfile } disabled={ disabled }>
					{ __( 'Add profile', 'jetpack-seo' ) }
				</Button>
			</Stack>
		</Stack>
	);
};

export default ProfileUrlList;
