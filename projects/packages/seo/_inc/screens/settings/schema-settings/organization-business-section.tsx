/* eslint-disable react/jsx-no-bind */

import { TextControl, TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Button, Stack } from '@wordpress/ui';
import ProfileUrlList, { hasProfileUrlErrors } from './profile-url-list';
import type { SchemaSettingsForm } from '../../../data/use-schema-settings';
import type { FC } from 'react';

const saveLabel = __( 'Save', 'jetpack-seo' );

interface Props {
	/** The schema-settings form controller, owned by the Schema card. */
	form: SchemaSettingsForm;
}

/**
 * The "Organization / Business info" form inside the Schema settings card. Edits
 * the site-level Organization schema values WordPress has no native source for —
 * social profiles (`sameAs`), an optional contact email — plus optional `name` /
 * `description` overrides. Saved through the package's own REST route (never
 * `/jetpack/v4/settings`).
 *
 * Presentational: the Schema card owns the {@link useSchemaSettings} controller
 * (so the header badge and this form share one state) and passes it in via `form`.
 *
 * @param props      - Component props.
 * @param props.form - The schema-settings form controller from the card.
 * @return The Organization settings form.
 */
const OrganizationBusinessSection: FC< Props > = ( { form } ) => {
	const { organization, defaults, isSaving, isDirty, setOrganizationField, save } = form;
	const { name, description, sameAs, email } = organization;
	const hasProfileErrors = hasProfileUrlErrors( sameAs );

	return (
		<Stack direction="column" gap="lg">
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

			<div className="jetpack-seo-settings__save">
				<Button onClick={ save } disabled={ isSaving || ! isDirty || hasProfileErrors }>
					{ saveLabel }
				</Button>
			</div>
		</Stack>
	);
};

export default OrganizationBusinessSection;
