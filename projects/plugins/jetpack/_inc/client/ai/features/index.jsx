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

// Server-computed target for the AI SEO row: the dedicated Jetpack SEO page
// where it exists, the Traffic settings card otherwise. Falls back to Traffic
// when jetpackAiSettings is unavailable (e.g. in tests).
const { seoSettingsUrl } = window?.jetpackAiSettings ?? {};

// Per the design, a row's action link depends on the toggle state: enabled
// features invite you to try them (AI SEO opens its settings), disabled ones
// link to documentation via registered Jetpack Redirects handlers.
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
					href: getRedirectUrl( 'jetpack-ai-settings-writing-assistant-learn-more' ),
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
					href: getRedirectUrl( 'jetpack-ai-settings-image-editor-learn-more' ),
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
					href: getRedirectUrl( 'jetpack-ai-settings-feature-clip-learn-more' ),
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
					href: seoSettingsUrl || 'admin.php?page=jetpack#/traffic',
				},
				disabledAction: {
					label: __( 'Learn more', 'jetpack' ),
					href: getRedirectUrl( 'jetpack-ai-settings-seo-learn-more' ),
					external: true,
				},
			},
		],
	},
];

/**
 * Filter sections down to the feature rows the endpoint reported as usable.
 * A toggle without a backend would render stuck at "off" and save nothing,
 * so a row only renders when its key is present in the settings response —
 * and not explicitly marked unavailable (e.g. the SEO enhancer where the
 * seo-tools module is off). Sections left with no rows are dropped entirely.
 *
 * @param {Array}  sections - SECTIONS-shaped list.
 * @param {object} features - The features object from the settings response.
 * @return {Array} Sections containing only reported, available feature rows.
 */
export function visibleSections( sections, features ) {
	return sections
		.map( section => ( {
			...section,
			features: section.features.filter( feature => {
				const reported = features[ feature.key ];
				return reported !== undefined && reported.available !== false;
			} ),
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
