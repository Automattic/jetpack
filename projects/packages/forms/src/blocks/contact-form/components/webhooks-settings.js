import { TextControl, ToggleControl, ExternalLink } from '@wordpress/components';
import { useState, useEffect, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const WebhooksSettings = ( { setAttributes, webhooks } ) => {
	// For now, we only support one webhook, but the data structure supports multiple
	const firstWebhook = webhooks?.[ 0 ] || null;

	const [ localWebhookId, setLocalWebhookId ] = useState( firstWebhook?.webhook_id || '' );
	const [ localWebhookUrl, setLocalWebhookUrl ] = useState( firstWebhook?.url || '' );
	const [ localWebhookEnabled, setLocalWebhookEnabled ] = useState(
		firstWebhook?.enabled || false
	);

	// Sync local state with attributes when webhook changes
	useEffect( () => {
		if ( firstWebhook ) {
			setLocalWebhookId( firstWebhook.webhook_id || '' );
			setLocalWebhookUrl( firstWebhook.url || '' );
			setLocalWebhookEnabled( firstWebhook.enabled || false );
		}
	}, [ firstWebhook ] );

	const updateWebhook = ( id, url, enabled ) => {
		if ( ! url && ! enabled ) {
			// If URL is empty and webhook is disabled, remove it from the array
			setAttributes( { webhooks: [] } );
			return;
		}

		const webhook = {
			webhook_id: id || '',
			url: url || '',
			format: 'json', // Default to json, no UI for changing this yet
			method: 'POST', // Default to POST, no UI for changing this yet
			enabled: enabled,
		};

		setAttributes( { webhooks: [ webhook ] } );
	};

	return (
		<>
			<ToggleControl
				label={ __( 'Enable webhook', 'jetpack-forms' ) }
				help={ createInterpolateElement(
					__(
						'Send form submission data to an external URL. <webhookDocsLink>Learn more about webhooks.</webhookDocsLink>',
						'jetpack-forms'
					),
					{
						webhookDocsLink: (
							<ExternalLink href="https://jetpack.com/support/jetpack-forms/webhooks/" />
						),
					}
				) }
				checked={ localWebhookEnabled }
				onChange={ value => {
					setLocalWebhookEnabled( value );
					updateWebhook( localWebhookId, localWebhookUrl, value );
				} }
				__nextHasNoMarginBottom={ true }
			/>
			{ localWebhookEnabled && (
				<>
					<TextControl
						label={ __( 'Webhook ID', 'jetpack-forms' ) }
						value={ localWebhookId }
						onChange={ value => {
							setLocalWebhookId( value );
							updateWebhook( value, localWebhookUrl, localWebhookEnabled );
						} }
						placeholder="webhook-1"
						help={ __( 'A unique identifier for this webhook.', 'jetpack-forms' ) }
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
					/>
					<TextControl
						label={ __( 'Webhook URL', 'jetpack-forms' ) }
						value={ localWebhookUrl }
						onChange={ value => {
							setLocalWebhookUrl( value );
							updateWebhook( localWebhookId, value, localWebhookEnabled );
						} }
						placeholder="https://example.com/webhook"
						help={ __(
							'Enter the URL where form submission data should be sent.',
							'jetpack-forms'
						) }
						type="url"
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
					/>
				</>
			) }
		</>
	);
};

export default WebhooksSettings;
