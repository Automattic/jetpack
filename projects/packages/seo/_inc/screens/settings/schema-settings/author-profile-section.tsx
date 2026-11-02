/* eslint-disable react/jsx-no-bind */

import { TextControl, TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Button, ButtonLink, Link, Stack, Text } from '@wordpress/ui';
import ProfileUrlList, { hasProfileUrlErrors } from './profile-url-list';
import styles from './style.module.scss';
import type { AuthorProfileForm } from '../../../data/use-author-profile';
import type { FC } from 'react';

const saveLabel = __( 'Save', 'jetpack-seo' );

interface Props {
	/** The author-profile form controller, owned by the Author profile card. */
	form: AuthorProfileForm;
	disabled?: boolean;
}

/**
 * The form inside the Author profile card. Edits the signed-in user's Person
 * schema source: name, bio, and website from the WordPress profile, plus the
 * Jetpack SEO job title and social profiles (`sameAs`). Where WordPress.com owns
 * name, bio, and website, they're shown as text with a link to edit them there.
 *
 * Presentational: the Author profile card owns the {@link useAuthorProfile}
 * controller (so the header status and this form share one state) and passes it
 * in via `form`.
 *
 * @param props          - Component props.
 * @param props.form     - The author-profile form controller from the card.
 * @param props.disabled - Whether editing is disabled.
 * @return The Author profile form.
 */
const AuthorProfileSection: FC< Props > = ( { form, disabled = false } ) => {
	const {
		profile,
		avatarUrl,
		accountProfileUrl,
		isLoading,
		hasLoadError,
		isSaving,
		isDirty,
		setProfileField,
		save,
	} = form;
	const { name, description, url, jobTitle, sameAs } = profile;
	const controlsDisabled = disabled || isLoading || isSaving || hasLoadError;
	const accountOwned = '' !== accountProfileUrl;
	const hasNameError = ! accountOwned && ! isLoading && ! hasLoadError && '' === name.trim();
	const hasProfileErrors = hasProfileUrlErrors( sameAs );

	const avatar = (
		<Stack direction="row" align="center" gap="sm" className={ styles.avatar }>
			{ avatarUrl ? <img src={ avatarUrl } alt={ __( 'Author avatar', 'jetpack-seo' ) } /> : null }
			<Link href="https://gravatar.com/profile" openInNewTab rel="noopener noreferrer">
				{ __( 'Change your photo on Gravatar', 'jetpack-seo' ) }
			</Link>
		</Stack>
	);

	return (
		<Stack direction="column" gap="lg">
			<Text variant="body-md" render={ <p /> }>
				{ accountOwned
					? __( 'Adds Person schema to your articles and author archive.', 'jetpack-seo' )
					: __(
							'Adds Person schema to your articles and author archive. Name, bio, and website also update your WordPress profile.',
							'jetpack-seo'
						) }
			</Text>

			{ /* Values a WordPress.com account owns render as text, not inputs: DataForm's
			     `readOnly` convention for fields that can never be edited here. */ }
			{ accountOwned ? (
				<div className={ styles.accountProfile }>
					<Stack direction="row" justify="space-between" align="center" gap="sm" wrap="wrap">
						<Text variant="heading-md" render={ <h3 /> }>
							{ __( 'From your WordPress.com profile', 'jetpack-seo' ) }
						</Text>
						<ButtonLink
							variant="outline"
							size="compact"
							href={ accountProfileUrl }
							openInNewTab
							rel="noopener noreferrer"
						>
							{ __( 'Edit on WordPress.com', 'jetpack-seo' ) }
						</ButtonLink>
					</Stack>
					<dl className={ styles.accountProfileList }>
						{ [
							[ __( 'Name', 'jetpack-seo' ), name ],
							[ __( 'Bio', 'jetpack-seo' ), description ],
							[ __( 'Website', 'jetpack-seo' ), url ],
						].map( ( [ label, value ] ) => (
							<div key={ label }>
								<Text variant="heading-sm" className={ styles.fieldLabel } render={ <dt /> }>
									{ label }
								</Text>
								<Text
									variant="body-md"
									className={ value ? undefined : styles.muted }
									render={ <dd /> }
								>
									{ value || __( 'Not set', 'jetpack-seo' ) }
								</Text>
							</div>
						) ) }
						<div>
							<Text variant="heading-sm" className={ styles.fieldLabel } render={ <dt /> }>
								{ __( 'Avatar', 'jetpack-seo' ) }
							</Text>
							<dd>{ avatar }</dd>
						</div>
					</dl>
				</div>
			) : (
				<>
					<TextControl
						label={ __( 'Name', 'jetpack-seo' ) }
						value={ name }
						onChange={ next => setProfileField( { name: next } ) }
						disabled={ controlsDisabled }
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
						disabled={ controlsDisabled }
						__nextHasNoMarginBottom
					/>

					<TextControl
						label={ __( 'Website', 'jetpack-seo' ) }
						type="url"
						value={ url }
						onChange={ next => setProfileField( { url: next } ) }
						disabled={ controlsDisabled }
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>

					<Stack direction="column" gap="sm">
						<Text variant="heading-sm" className={ styles.fieldLabel }>
							{ __( 'Avatar', 'jetpack-seo' ) }
						</Text>
						{ avatar }
					</Stack>
				</>
			) }

			<TextControl
				label={ __( 'Job title', 'jetpack-seo' ) }
				value={ jobTitle }
				onChange={ next => setProfileField( { jobTitle: next } ) }
				disabled={ controlsDisabled }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>

			<ProfileUrlList
				label={ __( 'Social profiles', 'jetpack-seo' ) }
				help={ __( 'Links to your public profiles — Facebook, X, LinkedIn.', 'jetpack-seo' ) }
				urls={ sameAs }
				onChange={ next => setProfileField( { sameAs: next } ) }
				disabled={ controlsDisabled }
			/>

			<Stack direction="row" justify="flex-end">
				<Button
					onClick={ save }
					disabled={ controlsDisabled || ! isDirty || hasNameError || hasProfileErrors }
					aria-label={ __( 'Save author profile', 'jetpack-seo' ) }
				>
					{ saveLabel }
				</Button>
			</Stack>
		</Stack>
	);
};

export default AuthorProfileSection;
