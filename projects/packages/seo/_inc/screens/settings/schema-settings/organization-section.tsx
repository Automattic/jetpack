/* eslint-disable react/jsx-no-bind */

import { TextControl, TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import ProfileUrlList, { hasProfileUrlErrors } from './profile-url-list';
import styles from './style.module.scss';
import type { SchemaSettingsForm } from '../../../data/use-schema-settings';
import type { FC } from 'react';

const saveLabel = __( 'Save', 'jetpack-seo' );

interface Props {
	/** The schema-settings form controller, owned by the Schema card group. */
	form: SchemaSettingsForm;
}

/**
 * The Organization settings form.
 *
 * @param props      - Component props.
 * @param props.form - The shared schema-settings form controller.
 * @return The Organization settings form.
 */
const OrganizationSection: FC< Props > = ( { form } ) => {
	const {
		organization,
		defaults,
		isSaving,
		isOrganizationDirty,
		setOrganizationField,
		saveOrganization,
	} = form;
	const { name, description, sameAs, email } = organization;

	return (
		<Stack direction="column" gap="lg">
			<Text variant="body-sm" className={ styles.muted }>
				{ __( 'Help search engines understand the organization behind this site.', 'jetpack-seo' ) }
			</Text>

			<TextControl
				label={ __( 'Organization name', 'jetpack-seo' ) }
				help={ __(
					'The name used for your site’s Organization schema. Leave blank to use your Site Title.',
					'jetpack-seo'
				) }
				placeholder={ defaults.name }
				value={ name }
				onChange={ next => setOrganizationField( { name: next } ) }
				disabled={ isSaving }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>

			<TextareaControl
				label={ __( 'Description', 'jetpack-seo' ) }
				help={ __(
					'A short description of your organization. Leave blank to use your site Tagline.',
					'jetpack-seo'
				) }
				placeholder={ defaults.description }
				value={ description }
				onChange={ next => setOrganizationField( { description: next } ) }
				rows={ 3 }
				disabled={ isSaving }
				__nextHasNoMarginBottom
			/>

			<ProfileUrlList
				label={ __( 'Social profiles', 'jetpack-seo' ) }
				help={ __(
					'Links to official profiles for this organization (for example Facebook, X, LinkedIn).',
					'jetpack-seo'
				) }
				urls={ sameAs }
				onChange={ next => setOrganizationField( { sameAs: next } ) }
				disabled={ isSaving }
			/>

			<TextControl
				label={ __( 'Contact email', 'jetpack-seo' ) }
				help={ __( 'A public contact email for this organization.', 'jetpack-seo' ) }
				type="email"
				value={ email }
				onChange={ next => setOrganizationField( { email: next } ) }
				disabled={ isSaving }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>

			<Stack direction="row" justify="flex-end">
				<Button
					onClick={ saveOrganization }
					disabled={ isSaving || ! isOrganizationDirty || hasProfileUrlErrors( sameAs ) }
					aria-label={ __( 'Save organization', 'jetpack-seo' ) }
				>
					{ saveLabel }
				</Button>
			</Stack>
		</Stack>
	);
};

export default OrganizationSection;
