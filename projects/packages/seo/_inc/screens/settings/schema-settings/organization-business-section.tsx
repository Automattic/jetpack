/* eslint-disable react/jsx-no-bind */

import { Button as WPButton, TextControl, TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Button, Stack } from '@wordpress/ui';
import { normalizeProfileUrl } from '../../../data/schema-settings-utils';
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
	const normalizedProfiles = sameAs.map( normalizeProfileUrl );
	const profileErrors = sameAs.map( ( profile, index ) => {
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
	const hasProfileErrors = profileErrors.some( Boolean );

	const setSameAs = ( index: number, value: string ) => {
		const next = sameAs.slice();
		next[ index ] = value;
		setOrganizationField( { sameAs: next } );
	};

	const addProfile = () => setOrganizationField( { sameAs: [ ...sameAs, '' ] } );

	const removeProfile = ( index: number ) =>
		setOrganizationField( { sameAs: sameAs.filter( ( _, i ) => i !== index ) } );

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

			<Stack direction="column" gap="sm">
				<span className="jetpack-seo-settings__schema-field-label">
					{ __( 'Social profiles', 'jetpack-seo' ) }
				</span>
				<span className="jetpack-seo-settings__title-tokens-label">
					{ __(
						'Links to official profiles for this organization (for example Facebook, X, LinkedIn).',
						'jetpack-seo'
					) }
				</span>
				{ sameAs.map( ( profile, index ) => {
					const profileError = profileErrors[ index ];
					return (
						<Stack key={ index } direction="row" gap="sm" align="flex-start" wrap="wrap">
							<div
								className={
									'jetpack-seo-settings__schema-profile-input' +
									( profileError ? ' jetpack-seo-settings__schema-profile-input--error' : '' )
								}
							>
								<TextControl
									label={ __( 'Profile URL', 'jetpack-seo' ) }
									hideLabelFromVision
									type="url"
									placeholder="https://"
									value={ profile }
									onChange={ next => setSameAs( index, next ) }
									disabled={ isSaving }
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
								disabled={ isSaving }
								__next40pxDefaultSize
							>
								{ __( 'Remove profile', 'jetpack-seo' ) }
							</WPButton>
						</Stack>
					);
				} ) }
				<div>
					<Button variant="outline" tone="neutral" onClick={ addProfile } disabled={ isSaving }>
						{ __( 'Add profile', 'jetpack-seo' ) }
					</Button>
				</div>
			</Stack>

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
