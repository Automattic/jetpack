/* eslint-disable react/jsx-no-bind */

import { Button, Notice, TextareaControl, ToggleControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Badge, Card, CollapsibleCard, Stack } from '@wordpress/ui';
import TitleStructureField from './title-structure-field';
import VerificationCard from './verification-card';
import './style.scss';
import type { SettingsForm } from '../../data/use-settings';
import type { FC } from 'react';

// Pre-resolved so the production minifier can't fold adjacent ternary `__()`
// calls (breaks i18n extraction). See feedback_i18n_ternary_minifier_fold.
const setLabel = __( 'Set', 'jetpack-seo' );
const notSetLabel = __( 'Not set', 'jetpack-seo' );

interface Props {
	form: SettingsForm;
}

/**
 * Consolidated Settings screen. State + persistence live in the `form`
 * controller (passed from the page root so edits survive tab switches);
 * this component is the presentation + Save affordance.
 *
 * @param props      - Component props.
 * @param props.form - The settings form controller from `useSettingsForm`.
 * @return The Settings tab content.
 */
const SettingsScreen: FC< Props > = ( { form } ) => {
	const { local, isDirty, isSaving, save, update, setVerification } = form;

	if ( ! local ) {
		return (
			<Notice status="error" isDismissible={ false }>
				{ __( 'Unable to load settings.', 'jetpack-seo' ) }
			</Notice>
		);
	}

	const postsTokens = local.title_formats.posts ?? [];
	const visibilityEnabledCount =
		( local.search_engines_visible ? 1 : 0 ) + ( local.sitemap_active ? 1 : 0 );

	return (
		<div className="jetpack-seo-settings">
			<div className="jetpack-seo-settings__actions">
				<Button
					variant="primary"
					onClick={ save }
					disabled={ ! isDirty || isSaving }
					isBusy={ isSaving }
					__next40pxDefaultSize
				>
					{ __( 'Save', 'jetpack-seo' ) }
				</Button>
			</div>

			<CollapsibleCard.Root defaultOpen>
				<CollapsibleCard.Header>
					<Stack direction="row" justify="space-between" align="center" gap="sm">
						<Card.Title>{ __( 'Site visibility', 'jetpack-seo' ) }</Card.Title>
						<Badge intent={ visibilityEnabledCount === 2 ? 'stable' : 'draft' }>
							{ sprintf(
								/* translators: %1$d: number of enabled visibility settings, %2$d: total. */
								__( '%1$d of %2$d enabled', 'jetpack-seo' ),
								visibilityEnabledCount,
								2
							) }
						</Badge>
					</Stack>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<Stack direction="column" gap="lg">
						<ToggleControl
							label={ __( 'Allow search engines to index this site', 'jetpack-seo' ) }
							help={ __(
								'Mirrors Settings → Reading → "Discourage search engines from indexing this site". Turning this off asks search engines to stop indexing your site; honored by Google and Bing, ignored by others. Use only for staging or pre-launch sites.',
								'jetpack-seo'
							) }
							checked={ local.search_engines_visible }
							onChange={ next => update( { search_engines_visible: next } ) }
							disabled={ isSaving }
							__nextHasNoMarginBottom
						/>
						<ToggleControl
							label={ __( 'Generate an XML sitemap', 'jetpack-seo' ) }
							help={ __(
								"Publishes an XML sitemap that search engines crawl to discover your content, generated automatically from your site's published posts, pages, and custom post types.",
								'jetpack-seo'
							) }
							checked={ local.sitemap_active }
							onChange={ next => update( { sitemap_active: next } ) }
							disabled={ isSaving }
							__nextHasNoMarginBottom
						/>
					</Stack>
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>

			<TitleStructureField
				tokens={ postsTokens }
				onChange={ next => update( { title_formats: { ...local.title_formats, posts: next } } ) }
				disabled={ isSaving }
			/>

			<CollapsibleCard.Root defaultOpen={ false }>
				<CollapsibleCard.Header>
					<Stack direction="row" justify="space-between" align="center" gap="sm">
						<Card.Title>{ __( 'Front-page description', 'jetpack-seo' ) }</Card.Title>
						<Badge intent={ local.front_page_description ? 'stable' : 'draft' }>
							{ local.front_page_description ? setLabel : notSetLabel }
						</Badge>
					</Stack>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<TextareaControl
						label={ __( 'Meta description shown on the home page', 'jetpack-seo' ) }
						value={ local.front_page_description }
						onChange={ next => update( { front_page_description: next } ) }
						rows={ 3 }
						disabled={ isSaving }
						__nextHasNoMarginBottom
					/>
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>

			<VerificationCard
				value={ local.verification }
				onChange={ setVerification }
				disabled={ isSaving }
			/>
		</div>
	);
};

export default SettingsScreen;
