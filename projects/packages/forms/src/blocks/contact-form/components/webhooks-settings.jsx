import jetpackAnalytics from '@automattic/jetpack-analytics';
import { TextControl, ToggleControl } from '@wordpress/components';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const WebhooksSettings = ( { setAttributes, webhooks, clientId } ) => {
	// For now, we only support one webhook, but the data structure supports multiple
	const firstWebhook = webhooks?.[ 0 ] || null;

	// Generate a unique webhook ID based on clientId
	const generateWebhookId = useCallback(
		( index = 1 ) => {
			// Use a shortened version of clientId (first 8 chars) for readability
			const shortId = clientId?.substring( 0, 8 ) || 'unknown';
			return `webhook-${ shortId }-${ index }`;
		},
		[ clientId ]
	);

	const [ localWebhookId, setLocalWebhookId ] = useState(
		firstWebhook?.webhook_id || generateWebhookId( 1 )
	);
	const [ localWebhookUrl, setLocalWebhookUrl ] = useState( firstWebhook?.url || '' );
	const [ localWebhookEnabled, setLocalWebhookEnabled ] = useState(
		firstWebhook?.enabled || false
	);

	// Sync local state with attributes when webhook changes
	useEffect( () => {
		if ( firstWebhook ) {
			setLocalWebhookId( firstWebhook.webhook_id || generateWebhookId( 1 ) );
			setLocalWebhookUrl( firstWebhook.url || '' );
			setLocalWebhookEnabled( firstWebhook.enabled || false );
		}
	}, [ firstWebhook, generateWebhookId ] );

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
				help={ __( 'Send form submission data to an external URL.', 'jetpack-forms' ) }
				checked={ localWebhookEnabled }
				onChange={ value => {
					jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_webhook_toggle', {
						origin: 'block-editor',
						enabled: value,
					} );
					setLocalWebhookEnabled( value );
					// Auto-generate webhook ID when enabling if it doesn't exist
					const webhookId = localWebhookId || generateWebhookId( webhooks?.length + 1 || 1 );
					setLocalWebhookId( webhookId );
					updateWebhook( webhookId, localWebhookUrl, value );
				} }
				__nextHasNoMarginBottom={ true }
			/>
			{ localWebhookEnabled && (
				<>
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
					<TextControl
						label={ __( 'Webhook ID', 'jetpack-forms' ) }
						value={ localWebhookId }
						onChange={ value => {
							setLocalWebhookId( value );
							updateWebhook( value, localWebhookUrl, localWebhookEnabled );
						} }
						help={ __(
							'Auto-generated unique identifier. You can customize it if needed.',
							'jetpack-forms'
						) }
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
					/>
				</>
			) }
		</>
	);
};

export default WebhooksSettings;
