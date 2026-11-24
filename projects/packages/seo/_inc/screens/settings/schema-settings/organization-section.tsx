/* eslint-disable react/jsx-no-bind */

import { __ } from '@wordpress/i18n';
import { InputControl, Stack, Text, TextareaControl } from '@wordpress/ui';
import ProfileUrlList from './profile-url-list';
import type { SchemaSettingsForm } from '../../../data/use-schema-settings';
import type { FC } from 'react';

interface Props {
	/** The schema-settings form controller, owned by the Schema card group. */
	form: SchemaSettingsForm;
	disabled?: boolean;
}

/**
 * The Organization settings fields. Presentational only — the module's single
 * Save button (which persists these values together with the LocalBusiness
 * refinement below) lives in the parent Schema card.
 *
 * @param props          - Component props.
 * @param props.form     - The shared schema-settings form controller.
 * @param props.disabled - Whether editing is disabled.
 * @return The Organization settings fields.
 */
const OrganizationSection: FC< Props > = ( { form, disabled = false } ) => {
	const { organization, defaults, isSaving, setOrganizationField } = form;
	const { name, description, sameAs, email } = organization;

	return (
		<Stack direction="column" gap="lg">
			<Text variant="body-md" render={ <p /> }>
				{ __(
					'About the organization behind this site. Your Site Logo or Site Icon is used as the logo.',
					'jetpack-seo'
				) }
			</Text>

			{ /* The visible label stays one word (WPDS renders control labels as 11px
			     all-caps), but the Author profile card on this same tab also has a
			     "Name" field — so the accessible name says which one this is. */ }
			<InputControl
				label={ __( 'Name', 'jetpack-seo' ) }
				aria-label={ __( 'Organization name', 'jetpack-seo' ) }
				// Drop the field's own `aria-labelledby`, which would beat this `aria-label`.
				aria-labelledby={ undefined }
				description={ __(
					'The organization’s name, as you want it to appear in search results. Leave blank to use your Site Title.',
					'jetpack-seo'
				) }
				placeholder={ defaults.name }
				value={ name }
				onValueChange={ next => setOrganizationField( { name: next } ) }
				disabled={ disabled || isSaving }
			/>

			<TextareaControl
				label={ __( 'Description', 'jetpack-seo' ) }
				description={ __(
					'A sentence or two about what the organization does. Leave blank to use your site Tagline.',
					'jetpack-seo'
				) }
				placeholder={ defaults.description }
				value={ description }
				onValueChange={ next => setOrganizationField( { description: next } ) }
				rows={ 3 }
				disabled={ disabled || isSaving }
			/>

			<ProfileUrlList
				label={ __( 'Social & profile links', 'jetpack-seo' ) }
				help={ __(
					'Links to the organization’s official profiles — Facebook, X, LinkedIn, a Wikipedia page. These help search engines confirm it’s the same organization across the web.',
					'jetpack-seo'
				) }
				urls={ sameAs }
				onChange={ next => setOrganizationField( { sameAs: next } ) }
				disabled={ disabled || isSaving }
			/>

			<InputControl
				label={ __( 'Contact email', 'jetpack-seo' ) }
				description={ __( 'A public contact email for the organization.', 'jetpack-seo' ) }
				type="email"
				value={ email }
				onValueChange={ next => setOrganizationField( { email: next } ) }
				disabled={ disabled || isSaving }
			/>
		</Stack>
	);
};

export default OrganizationSection;
