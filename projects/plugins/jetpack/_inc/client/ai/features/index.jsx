/**
 * AI Features view — per-feature toggles for Jetpack AI, grouped by area
 * (Content, Media, SEO, Search) per the AI-Settings design.
 *
 * Each feature has its own on/off switch, backed by the feature-settings
 * endpoint. A disabled feature must genuinely stop loading (its assets are
 * not enqueued), not just disappear from view.
 */

import { getRedirectUrl } from '@automattic/jetpack-components';
import { ToggleControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Card, Link, Notice, Popover, Stack, Text, VisuallyHidden } from '@wordpress/ui';
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
					'Draft, rewrite, translate, and adjust tone for your content right in the block editor.',
					'jetpack'
				),
				enabledAction: {
					label: __( 'Try it out in the editor', 'jetpack' ),
					// The arg asks the ai-assistant-plugin sidebar to open itself
					// once the editor loads (same convention as openSidebar=global-styles).
					href: 'post-new.php?openSidebar=jetpack-ai-assistant',
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
				enabledAction: {
					label: __( 'Try it out', 'jetpack' ),
					// ai-assistant makes the Image Studio bundle open Generate mode
					// on the Media Library (it strips the param once handled).
					href: 'upload.php?ai-assistant',
				},
				disabledAction: {
					label: __( 'Learn more', 'jetpack' ),
					href: getRedirectUrl( 'jetpack-ai-settings-image-editor-learn-more' ),
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
					'AI recommendations to optimize titles, meta descriptions, and content for search engines.',
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
	{
		key: 'search',
		title: __( 'Search', 'jetpack' ),
		features: [
			{
				key: 'ai_search',
				label: __( 'AI Search', 'jetpack' ),
				description: __(
					'Help visitors and AI agents find answers in your content, via Jetpack Search.',
					'jetpack'
				),
				enabledAction: {
					label: __( 'Open Search Settings', 'jetpack' ),
					href: 'admin.php?page=jetpack-search',
				},
				disabledAction: {
					label: __( 'Learn more', 'jetpack' ),
					href: getRedirectUrl( 'jetpack-ai-settings-search-learn-more' ),
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
 * @param {object}   props               - Component props.
 * @param {object}   props.feature       - Entry from SECTIONS[].features.
 * @param {object}   props.reported      - This feature's object from the settings response.
 * @param {boolean}  props.checked       - Whether the feature is enabled.
 * @param {boolean}  props.isSaving      - Whether this toggle is being saved.
 * @param {boolean}  props.masterEnabled - Whether the site-wide AI master switch is on.
 * @param {boolean}  props.isConnected   - Whether the AI connection gate passes (connected owner, not offline).
 * @param {Function} props.onChange      - Called with (key, enabled) on toggle.
 * @return {object} Component markup.
 */
function FeatureRow( {
	feature,
	reported,
	checked,
	isSaving,
	masterEnabled,
	isConnected,
	onChange,
} ) {
	const handleChange = useCallback(
		enabled => onChange( feature.key, enabled ),
		[ feature.key, onChange ]
	);

	const action = checked ? feature.enabledAction : feature.disabledAction;
	// The toggle keeps showing the SAVED value but can't be used while the
	// connection gate fails (no feature can load without it), while the master
	// switch is off (the saved choice returns when master does), or while the
	// plan doesn't include the individual feature. There is deliberately no
	// site-wide plan gate here: every connected site can run the free tier.
	const isDisabled = isSaving || ! isConnected || ! masterEnabled || !! reported?.requires_upgrade;

	return (
		<Stack direction="column" gap="xs" className="jetpack-ai-features__row">
			<ToggleControl
				__nextHasNoMarginBottom
				checked={ checked }
				disabled={ isDisabled }
				label={ feature.label }
				help={ feature.description }
				onChange={ handleChange }
			/>
			{ action && masterEnabled && isConnected && (
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
 * @param {Function} props.onUpdate   - Called with a partial settings update payload; resolves true when the save succeeded.
 * @return {object} Component markup.
 */
export default function AiFeatures( { settings, savingKeys, onUpdate } ) {
	const features = settings?.features ?? {};
	// Children keep their saved values while the master switch is off — the
	// page shows them greyed with a site-wide notice instead of misreporting
	// the user's choices as off.
	const masterEnabled = settings?.master_enabled !== false;
	// The connection gate sits outside the master switch: false covers both a
	// site without a connected owner and one in offline mode, and in either
	// case no AI feature can load. Saved values stay visible but inert, and
	// the connection ask comes before any upgrade messaging.
	const isConnected = settings?.is_connected !== false;
	// There is no site-wide plan gate: a plan without paid Jetpack AI still has
	// the free tier, so a connected site can always run the free-tier features.
	// Paid-only features are gated per-feature via requires_upgrade instead.
	// The badge tooltip names the remedy for the gated Search section. A site
	// with a paid Search plan is pointed at Search setup; one with no Search
	// entitlement — or only the free tier, which reports supports_search but
	// cannot run AI Search — is asked to upgrade instead. Unlike the gates
	// above this defaults to the upgrade copy: pointing an unentitled site at
	// setup would send it down the wrong path, and the badge cannot render
	// before the payload (which carries `plan`) has arrived anyway.
	// NOTE: the badge itself is generic (any section whose features report
	// requires_upgrade), but this copy is Search-specific — ai_search is the
	// only feature the endpoint gates today. A second gated feature needs its
	// own copy here, not a silent reuse of this one.
	const hasPaidSearchPlan =
		settings?.plan?.supports_search === true && settings?.plan?.is_free_search_plan !== true;
	const upgradeBadgeTooltip = hasPaidSearchPlan
		? __( 'Set up Jetpack Search to enable this feature', 'jetpack' )
		: __(
				'Requires Jetpack Search or Complete plans',
				'jetpack',
				/* dummy arg to avoid bad minification */ 0
		  );

	const sections = visibleSections( SECTIONS, features );

	const handleToggle = useCallback(
		( key, enabled ) => {
			onUpdate( { features: { [ key ]: enabled } } ).then( saved => {
				// Track outcomes, not attempts: a failed save changed nothing.
				if ( saved ) {
					analytics.tracks.recordEvent( 'jetpack_ai_feature_toggled', {
						feature: key,
						enabled,
					} );
				}
			} );
		},
		[ onUpdate ]
	);

	const renderRow = feature => (
		<FeatureRow
			key={ feature.key }
			feature={ feature }
			reported={ features[ feature.key ] }
			checked={ !! features[ feature.key ]?.enabled }
			isSaving={ savingKeys.has( feature.key ) }
			masterEnabled={ masterEnabled }
			isConnected={ isConnected }
			onChange={ handleToggle }
		/>
	);

	return (
		<Stack direction="column" gap="md">
			{ ! isConnected && (
				<Notice.Root intent="warning">
					<Notice.Title>
						{ __( 'Jetpack is not connected to WordPress.com.', 'jetpack' ) }
					</Notice.Title>
					<Notice.Description>
						{ __(
							'AI features need a connection to run. Your saved settings will apply once the site is connected.',
							'jetpack'
						) }{ ' ' }
						<Link href="admin.php?page=my-jetpack#/connection">
							{ __( 'Connect Jetpack', 'jetpack' ) }
						</Link>
					</Notice.Description>
				</Notice.Root>
			) }
			{ isConnected && ! masterEnabled && (
				<Notice.Root intent="warning">
					<Notice.Title>
						{ __( 'Jetpack AI is turned off for this site.', 'jetpack' ) }
					</Notice.Title>
					<Notice.Description>
						{ __(
							'Your feature settings are saved and will apply again when AI is turned back on.',
							'jetpack'
						) }{ ' ' }
						<Link href="admin.php?page=my-jetpack">
							{ __( 'Manage in My Jetpack', 'jetpack' ) }
						</Link>
					</Notice.Description>
				</Notice.Root>
			) }
			{ sections.map( section => (
				<Card.Root key={ section.key }>
					<Card.Content>
						<Stack direction="column" gap="md">
							<div className="jetpack-ai-features__section-header">
								<Text as="h3" weight="600">
									{ section.title }
								</Text>
								{ isConnected &&
									section.features.some( f => features[ f.key ]?.requires_upgrade ) && (
										<Popover.Root>
											{ /* A popover rather than a tooltip: click opens it, touch
											     works, and screen readers announce the remedy copy —
											     the shape agreed with design on the PR. The trigger's
											     accessible name is its visible badge text. */ }
											<Popover.Trigger
												openOnHover
												delay={ 200 }
												closeDelay={ 200 }
												className="jetpack-ai-features__upgrade-badge"
											>
												<Badge intent="informational">
													{ __( 'Requires upgrade', 'jetpack' ) }
												</Badge>
											</Popover.Trigger>
											<Popover.Popup>
												<Popover.Arrow />
												<VisuallyHidden render={ <Popover.Title /> }>
													{ __( 'Requires upgrade', 'jetpack' ) }
												</VisuallyHidden>
												<Popover.Description>{ upgradeBadgeTooltip }</Popover.Description>
											</Popover.Popup>
										</Popover.Root>
									) }
							</div>
							{ section.features.map( feature => renderRow( feature ) ) }
						</Stack>
					</Card.Content>
				</Card.Root>
			) ) }
		</Stack>
	);
}
