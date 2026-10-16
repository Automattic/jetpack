import { BaseControl, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Badge, Link, Notice } from '@wordpress/ui';
import { getIntegrationSettings, updateIntegrationSettings } from './integration-settings.ts';
import type { CardItem, CardBuilderProps } from './types.ts';

export const SLACK_SLUG = 'jetpack/slack';

/**
 * Whether a string is a Slack incoming webhook URL.
 *
 * Mirrors the check in the PHP Slack service. The URL is the credential, and pinning it to
 * Slack's own host is what stops the field being used to send responses anywhere else.
 *
 * @param url - The candidate URL.
 * @return Whether the URL is a Slack incoming webhook.
 */
export const isValidSlackWebhookUrl = ( url: unknown ): boolean =>
	typeof url === 'string' &&
	/^https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/.test(
		url.trim()
	);

/**
 * Build the Slack integration card.
 *
 * @param props                     - Card builder props.
 * @param props.integration         - The integration's server-supplied metadata.
 * @param props.refreshIntegrations - Re-fetches integration status.
 * @param props.context             - Whether the card renders in the block editor or the dashboard.
 * @param props.attributes          - The form block's attributes.
 * @param props.setAttributes       - The form block's attribute setter.
 * @return The card.
 */
export function buildSlackCard( {
	integration,
	refreshIntegrations,
	context,
	attributes,
	setAttributes,
}: CardBuilderProps ): CardItem {
	const settings = getIntegrationSettings( SLACK_SLUG, attributes );
	const webhookUrl = ( settings.webhookUrl as string ) ?? '';
	const isEnabled = !! settings.enabled;
	// Sending the response itself is opt-out rather than opt-in: a notification with no
	// content is rarely what someone wants, but they should be able to choose it.
	const includeContent = settings.includeContent !== false;
	const isConfigured = isValidSlackWebhookUrl( webhookUrl );
	const isEditor = context === 'block-editor';

	return {
		id: integration.id,
		title: integration.title,
		description: integration.subtitle,
		cardData: {
			...integration,
			isLoading: typeof integration.isInstalled === 'undefined',
			refreshStatus: refreshIntegrations,
			showHeaderToggle: isEditor,
			...( isEditor && {
				headerToggleValue: isEnabled,
				isHeaderToggleEnabled: isConfigured,
				onHeaderToggleChange: ( value: boolean ) =>
					updateIntegrationSettings( SLACK_SLUG, attributes, setAttributes, {
						enabled: value,
					} ),
				toggleDisabledTooltip: ! isConfigured
					? __( 'Add a Slack webhook URL to enable.', 'jetpack-forms' )
					: undefined,
				isConnected: isConfigured,
			} ),
			setupBadge:
				context === 'dashboard' ? (
					<Badge intent="stable" className="integration-card__setup-badge">
						{ __( 'Configured per form', 'jetpack-forms' ) }
					</Badge>
				) : (
					<Badge intent="draft" className="integration-card__setup-badge">
						{ __( 'Add a webhook URL', 'jetpack-forms' ) }
					</Badge>
				),
		},
		body: isEditor ? (
			<BaseControl __nextHasNoMarginBottom={ true }>
				<TextControl
					label={ __( 'Slack webhook URL', 'jetpack-forms' ) }
					value={ webhookUrl }
					type="url"
					placeholder="https://hooks.slack.com/services/…"
					onChange={ ( value: string ) =>
						updateIntegrationSettings( SLACK_SLUG, attributes, setAttributes, {
							webhookUrl: value.trim(),
						} )
					}
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize={ true }
				/>
				{ webhookUrl && ! isConfigured && (
					<Notice.Root intent="error" style={ { marginBlockStart: '8px' } }>
						<Notice.Description>
							{ __(
								'That does not look like a Slack webhook URL. It should start with https://hooks.slack.com/services/',
								'jetpack-forms'
							) }
						</Notice.Description>
					</Notice.Root>
				) }
				<p>
					<Link openInNewTab href="https://api.slack.com/messaging/webhooks">
						{ __( 'How to create a Slack webhook URL', 'jetpack-forms' ) }
					</Link>
				</p>
				<ToggleControl
					label={ __( 'Include response content', 'jetpack-forms' ) }
					help={ __(
						'Post the answers to Slack. Turn this off to send only a notification and a link, keeping response content on your site.',
						'jetpack-forms'
					) }
					checked={ includeContent }
					onChange={ ( value: boolean ) =>
						updateIntegrationSettings( SLACK_SLUG, attributes, setAttributes, {
							includeContent: value,
						} )
					}
					__nextHasNoMarginBottom={ true }
				/>
			</BaseControl>
		) : (
			<div>
				<p className="integration-card__description">
					{ __(
						'Slack is set up for each form individually in the block editor. Open a form, then Form settings → Manage integrations.',
						'jetpack-forms'
					) }
				</p>
			</div>
		),
	};
}
