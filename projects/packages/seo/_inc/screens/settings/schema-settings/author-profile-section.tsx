/* eslint-disable react/jsx-no-bind */

import { TextControl, TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Button, Link, Stack, Text } from '@wordpress/ui';
import ProfileUrlList, { hasProfileUrlErrors } from './profile-url-list';
import styles from './style.module.scss';
import type { AuthorProfileForm } from '../../../data/use-author-profile';
import type { FC } from 'react';

const saveLabel = __( 'Save', 'jetpack-seo' );

interface Props {
	/** The author-profile form controller, owned by the Author profile card. */
	form: AuthorProfileForm;
}

/**
 * The form inside the Author profile card. Edits the signed-in user's Person
 * schema source: name, bio, and website write back to the WordPress profile
 * through core's users REST endpoint; job title and social profiles (`sameAs`)
 * are Jetpack SEO user meta.
 *
 * Presentational: the Author profile card owns the {@link useAuthorProfile}
 * controller (so the header status and this form share one state) and passes it
 * in via `form`.
 *
 * @param props      - Component props.
 * @param props.form - The author-profile form controller from the card.
 * @return The Author profile form.
 */
const AuthorProfileSection: FC< Props > = ( { form } ) => {
	const { profile, avatarUrl, isLoading, hasLoadError, isSaving, isDirty, setProfileField, save } =
		form;
	const { name, description, url, jobTitle, sameAs } = profile;
	const disabled = isLoading || isSaving || hasLoadError;
	const hasNameError = ! isLoading && ! hasLoadError && '' === name.trim();
	const hasProfileErrors = hasProfileUrlErrors( sameAs );

	return (
		<Stack direction="column" gap="lg">
			<Text variant="body-md" render={ <p /> }>
				{ __(
					'Adds Person schema to your articles and author archive. Name, bio, and website also update your WordPress profile.',
					'jetpack-seo'
				) }
			</Text>

			<TextControl
				label={ __( 'Name', 'jetpack-seo' ) }
				value={ name }
				onChange={ next => setProfileField( { name: next } ) }
				disabled={ disabled }
				help={ hasNameError ? __( 'Name is required.', 'jetpack-seo' ) : undefined }
				aria-invalid={ hasNameError }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>

			<TextareaControl
				label={ __( 'Bio', 'jetpack-seo' ) }
				value={ description }
				onChange={ next => setProfileField( { description: next } ) }
				rows={ 3 }
				disabled={ disabled }
				__nextHasNoMarginBottom
			/>

			<TextControl
				label={ __( 'Website', 'jetpack-seo' ) }
				type="url"
				value={ url }
				onChange={ next => setProfileField( { url: next } ) }
				disabled={ disabled }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>

			<Stack direction="column" gap="sm">
				<Text variant="heading-sm" className={ styles.fieldLabel }>
					{ __( 'Avatar', 'jetpack-seo' ) }
				</Text>
				<Stack direction="row" align="center" gap="sm" className={ styles.avatar }>
					{ avatarUrl ? (
						<img src={ avatarUrl } alt={ __( 'Author avatar', 'jetpack-seo' ) } />
					) : null }
					<Link href="https://gravatar.com/profile" openInNewTab rel="noopener noreferrer">
						{ __( 'Change your photo on Gravatar', 'jetpack-seo' ) }
					</Link>
				</Stack>
			</Stack>

			<TextControl
				label={ __( 'Job title', 'jetpack-seo' ) }
				value={ jobTitle }
				onChange={ next => setProfileField( { jobTitle: next } ) }
				disabled={ disabled }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>

			<ProfileUrlList
				label={ __( 'Social profiles', 'jetpack-seo' ) }
				help={ __( 'Links to your public profiles — Facebook, X, LinkedIn.', 'jetpack-seo' ) }
				urls={ sameAs }
				onChange={ next => setProfileField( { sameAs: next } ) }
				disabled={ disabled }
			/>

			<Stack direction="row" justify="flex-end">
				<Button
					onClick={ save }
					disabled={ disabled || ! isDirty || hasNameError || hasProfileErrors }
					aria-label={ __( 'Save author profile', 'jetpack-seo' ) }
				>
					{ saveLabel }
				</Button>
			</Stack>
		</Stack>
	);
};

export default AuthorProfileSection;
