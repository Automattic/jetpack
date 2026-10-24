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
 * The Person settings form, shown when the site represents a person. Describes
 * the individual the site is about — its main entity — as opposed to the per-post
 * Author profile, which describes each writer.
 *
 * @param props      - Component props.
 * @param props.form - The shared schema-settings form controller.
 * @return The Person settings form.
 */
const PersonSection: FC< Props > = ( { form } ) => {
	const { person, personDefaults, isSaving, isPersonDirty, setPersonField, savePerson } = form;
	const { name, description, sameAs } = person;

	return (
		<Stack direction="column" gap="lg">
			<Text variant="body-sm" className={ styles.muted }>
				{ __(
					'Tell search engines and AI who this site is about. Your Site Logo or Site Icon is used as the photo.',
					'jetpack-seo'
				) }
			</Text>

			<TextControl
				label={ __( 'Name', 'jetpack-seo' ) }
				help={ __(
					'Your full name, as you want it to appear in search results. Leave blank to use your Site Title.',
					'jetpack-seo'
				) }
				placeholder={ personDefaults.name }
				value={ name }
				onChange={ next => setPersonField( { name: next } ) }
				disabled={ isSaving }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>

			<TextareaControl
				label={ __( 'Short bio', 'jetpack-seo' ) }
				help={ __(
					'A sentence or two about who you are and what you do. Leave blank to use your site Tagline.',
					'jetpack-seo'
				) }
				placeholder={ personDefaults.description }
				value={ description }
				onChange={ next => setPersonField( { description: next } ) }
				rows={ 3 }
				disabled={ isSaving }
				__nextHasNoMarginBottom
			/>

			<ProfileUrlList
				label={ __( 'Social & profile links', 'jetpack-seo' ) }
				help={ __(
					'Links to your other profiles — LinkedIn, X, GitHub, a Wikipedia page. These help search engines confirm you are the same person across the web.',
					'jetpack-seo'
				) }
				urls={ sameAs }
				onChange={ next => setPersonField( { sameAs: next } ) }
				disabled={ isSaving }
			/>

			<Stack direction="row" justify="flex-end">
				<Button
					onClick={ savePerson }
					disabled={ isSaving || ! isPersonDirty || hasProfileUrlErrors( sameAs ) }
					aria-label={ __( 'Save person', 'jetpack-seo' ) }
				>
					{ saveLabel }
				</Button>
			</Stack>
		</Stack>
	);
};

export default PersonSection;
