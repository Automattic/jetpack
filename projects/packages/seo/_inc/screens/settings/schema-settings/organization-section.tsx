/* eslint-disable react/jsx-no-bind */

import { TextControl, TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import ProfileUrlList from './profile-url-list';
import type { SchemaSettingsForm } from '../../../data/use-schema-settings';
import type { FC } from 'react';

interface Props {
	/** The schema-settings form controller, owned by the Schema card group. */
	form: SchemaSettingsForm;
}

/**
 * The Organization settings fields. Presentational only — the module's single
 * Save button (which persists these values together with the LocalBusiness
 * refinement below) lives in the parent Schema card.
 *
 * @param props      - Component props.
 * @param props.form - The shared schema-settings form controller.
 * @return The Organization settings fields.
 */
const OrganizationSection: FC< Props > = ( { form } ) => {
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
			<TextControl
				label={ __( 'Name', 'jetpack-seo' ) }
				aria-label={ __( 'Organization name', 'jetpack-seo' ) }
				help={ __(
					'The organization’s name, as you want it to appear in search results. Leave blank to use your Site Title.',
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
					'A sentence or two about what the organization does. Leave blank to use your site Tagline.',
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
				label={ __( 'Social & profile links', 'jetpack-seo' ) }
				help={ __(
					'Links to the organization’s official profiles — Facebook, X, LinkedIn, a Wikipedia page. These help search engines confirm it’s the same organization across the web.',
					'jetpack-seo'
				) }
				urls={ sameAs }
				onChange={ next => setOrganizationField( { sameAs: next } ) }
				disabled={ isSaving }
			/>

			<TextControl
				label={ __( 'Contact email', 'jetpack-seo' ) }
				help={ __( 'A public contact email for the organization.', 'jetpack-seo' ) }
				type="email"
				value={ email }
				onChange={ next => setOrganizationField( { email: next } ) }
				disabled={ isSaving }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>
		</Stack>
	);
};

export default OrganizationSection;
