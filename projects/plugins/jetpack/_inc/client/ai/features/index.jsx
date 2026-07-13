/**
 * AI Features view — per-feature toggles for Jetpack AI, grouped by area
 * (Content, Media, SEO) per the AI-Settings design.
 *
 * Each feature has its own on/off switch, backed by the feature-settings
 * endpoint. A disabled feature must genuinely stop loading (its assets are
 * not enqueued), not just disappear from view.
 */

import { getRedirectUrl } from '@automattic/jetpack-components';
import { ToggleControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Link, Stack, Text } from '@wordpress/ui';
import analytics from 'lib/analytics';

// Per the design, a row's action link depends on the toggle state: enabled
// features invite you to try them, disabled ones link to documentation.
// The SEO settings link is the exception and shows in both states.
//
// @todo Register the jetpack-support-ai-<feature> source handlers in the
// Jetpack Redirects service before release — unregistered sources currently
// land on the Jetpack connect/install flow, not the docs.
const SECTIONS = [
	{
		key: 'content',
		title: __( 'Content', 'jetpack' ),
		features: [
			{
				key: 'writing_assistant',
				label: __( 'Writing Assistant', 'jetpack' ),
				description: __(
					'Generate, edit, and transform content in the block editor. Draft posts, rewrite paragraphs, translate, and adjust tone with a single click.',
					'jetpack'
				),
				enabledAction: {
					label: __( 'Try it out in the editor', 'jetpack' ),
					href: 'post-new.php',
				},
				disabledAction: {
					label: __( 'Learn more', 'jetpack' ),
					href: getRedirectUrl( 'jetpack-support-ai-writing-assistant' ),
					external: true,
				},
			},
			{
				key: 'excerpt',
				label: __( 'Excerpt', 'jetpack' ),
				description: __( 'Generate post excerpts with AI.', 'jetpack' ),
				enabledAction: {
					label: __( 'Try it out in the editor', 'jetpack' ),
					href: 'post-new.php',
				},
				disabledAction: {
					label: __( 'Learn more', 'jetpack' ),
					href: getRedirectUrl( 'jetpack-support-ai-excerpt' ),
					external: true,
				},
			},
		],
	},
	{
		key: 'media',
		title: __( 'Media', 'jetpack' ),
		features: [
			{
				key: 'image_editor',
				label: __( 'Image Editor', 'jetpack' ),
				description: __(
					'Generate and edit professional-quality images without leaving WordPress.',
					'jetpack'
				),
				enabledAction: { label: __( 'Try it out', 'jetpack' ), href: 'upload.php' },
				disabledAction: {
					label: __( 'Learn more', 'jetpack' ),
					href: getRedirectUrl( 'jetpack-support-ai-image-editor' ),
					external: true,
				},
			},
			{
				key: 'feature_clip',
				label: __( 'Feature Clip', 'jetpack' ),
				description: __( 'Generate videos for your posts.', 'jetpack' ),
				enabledAction: {
					label: __( 'Try it out in the editor', 'jetpack' ),
					href: 'post-new.php',
				},
				disabledAction: {
					label: __( 'Learn more', 'jetpack' ),
					href: getRedirectUrl( 'jetpack-support-ai-feature-clip' ),
					external: true,
				},
			},
		],
	},
	{
		key: 'seo',
		title: __( 'SEO', 'jetpack' ),
		features: [
			{
				key: 'seo_enhancer',
				label: __( 'AI SEO', 'jetpack' ),
				description: __(
					'Optimize post titles, meta descriptions, and on-page content for search engines with AI-powered recommendations.',
					'jetpack'
				),
				enabledAction: {
					label: __( 'Open SEO Settings', 'jetpack' ),
					href: 'admin.php?page=jetpack#/traffic',
				},
				disabledAction: {
					label: __( 'Open SEO Settings', 'jetpack' ),
					href: 'admin.php?page=jetpack#/traffic',
				},
			},
		],
	},
];

/**
 * Filter sections down to the feature rows the endpoint reported. A toggle
 * without a backend would render stuck at "off" and save nothing, so a row
 * only renders when its key is present in the settings response; sections
 * left with no rows are dropped entirely.
 *
 * @param {Array}  sections - SECTIONS-shaped list.
 * @param {object} features - The features object from the settings response.
 * @return {Array} Sections containing only reported feature rows.
 */
export function visibleSections( sections, features ) {
	return sections
		.map( section => ( {
			...section,
			features: section.features.filter( feature => features[ feature.key ] !== undefined ),
		} ) )
		.filter( section => section.features.length > 0 );
}

/**
 * A single feature row: toggle + description + optional action link.
 *
 * @param {object}   props          - Component props.
 * @param {object}   props.feature  - Entry from SECTIONS[].features.
 * @param {boolean}  props.checked  - Whether the feature is enabled.
 * @param {boolean}  props.isSaving - Whether this toggle is being saved.
 * @param {Function} props.onChange - Called with (key, enabled) on toggle.
 * @return {object} Component markup.
 */
function FeatureRow( { feature, checked, isSaving, onChange } ) {
	const handleChange = useCallback(
		enabled => onChange( feature.key, enabled ),
		[ feature.key, onChange ]
	);

	const action = checked ? feature.enabledAction : feature.disabledAction;

	return (
		<Stack direction="column" gap="xs" className="jetpack-ai-features__row">
			<ToggleControl
				__nextHasNoMarginBottom
				checked={ checked }
				disabled={ isSaving }
				label={ feature.label }
				help={ feature.description }
				onChange={ handleChange }
			/>
			{ action && (
				<Link
					className="jetpack-ai-features__action"
					href={ action.href }
					openInNewTab={ !! action.external }
				>
					{ action.label }
				</Link>
			) }
		</Stack>
	);
}

/**
 * AI Features view component.
 *
 * @param {object}   props            - Component props.
 * @param {object}   props.settings   - Full settings shape from the feature-settings endpoint.
 * @param {Set}      props.savingKeys - Keys currently being saved.
 * @param {Function} props.onUpdate   - Called with a partial settings update payload.
 * @return {object} Component markup.
 */
export default function AiFeatures( { settings, savingKeys, onUpdate } ) {
	const features = settings?.features ?? {};

	const sections = visibleSections( SECTIONS, features );

	const handleToggle = useCallback(
		( key, enabled ) => {
			analytics.tracks.recordEvent( 'jetpack_ai_feature_toggled', { feature: key, enabled } );
			onUpdate( { features: { [ key ]: enabled } } );
		},
		[ onUpdate ]
	);

	return (
		<Stack direction="column" gap="md">
			{ sections.map( section => (
				<Card.Root key={ section.key }>
					<Card.Content>
						<Stack direction="column" gap="md">
							<Text as="h3" weight="600">
								{ section.title }
							</Text>
							{ section.features.map( feature => (
								<FeatureRow
									key={ feature.key }
									feature={ feature }
									checked={ !! features[ feature.key ]?.enabled }
									isSaving={ savingKeys.has( feature.key ) }
									onChange={ handleToggle }
								/>
							) ) }
						</Stack>
					</Card.Content>
				</Card.Root>
			) ) }
		</Stack>
	);
}
