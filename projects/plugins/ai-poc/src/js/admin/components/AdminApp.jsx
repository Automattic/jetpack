import apiFetch from '@wordpress/api-fetch';
import { Button, TextControl, Notice } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './AdminApp.scss';

const AdminApp = () => {
	const [ apiKey, setApiKey ] = useState( '' );
	const [ hasApiKey, setHasApiKey ] = useState( false );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ notice, setNotice ] = useState( null );

	useEffect( () => {
		loadSettings();
	}, [] );

	const loadSettings = async () => {
		try {
			const response = await apiFetch( {
				path: '/jetpack-ai-poc/v1/settings',
			} );
			setHasApiKey( response.has_api_key );
		} catch ( error ) {
			setNotice( {
				type: 'error',
				message: __( 'Failed to load settings', 'jetpack-starter-plugin' ),
			} );
		}
	};

	const handleSave = async () => {
		if ( ! apiKey.trim() ) {
			setNotice( {
				type: 'error',
				message: __( 'Please enter an API key', 'jetpack-starter-plugin' ),
			} );
			return;
		}

		setIsSaving( true );
		setNotice( null );

		try {
			const response = await apiFetch( {
				path: '/jetpack-ai-poc/v1/settings',
				method: 'POST',
				data: { api_key: apiKey },
			} );

			if ( response.success ) {
				setNotice( {
					type: 'success',
					message: __( 'API key saved successfully', 'jetpack-starter-plugin' ),
				} );
				setHasApiKey( true );
				setApiKey( '' );
			} else {
				setNotice( {
					type: 'error',
					message: response.message || __( 'Failed to save API key', 'jetpack-starter-plugin' ),
				} );
			}
		} catch ( error ) {
			setNotice( {
				type: 'error',
				message: __( 'Failed to save API key', 'jetpack-starter-plugin' ),
			} );
		} finally {
			setIsSaving( false );
		}
	};

	return (
		<div className="jetpack-ai-poc-admin">
			<div className="jetpack-ai-poc-admin__header">
				<h1>{ __( 'Jetpack AI POC Settings', 'jetpack-starter-plugin' ) }</h1>
			</div>

			<div className="jetpack-ai-poc-admin__content">
				{ notice && (
					<Notice status={ notice.type } onRemove={ () => setNotice( null ) } isDismissible>
						{ notice.message }
					</Notice>
				) }

				<div className="jetpack-ai-poc-admin__section">
					<h2>{ __( 'Anthropic API Configuration', 'jetpack-starter-plugin' ) }</h2>
					<p>
						{ __(
							'Enter your Anthropic API key to enable AI-powered actions. You can obtain an API key from the Anthropic Console.',
							'jetpack-starter-plugin'
						) }
					</p>

					{ hasApiKey && (
						<Notice status="info" isDismissible={ false }>
							{ __( 'API key is configured', 'jetpack-starter-plugin' ) }
						</Notice>
					) }

					<TextControl
						label={ __( 'Anthropic API Key', 'jetpack-starter-plugin' ) }
						value={ apiKey }
						onChange={ setApiKey }
						type="password"
						placeholder={ __( 'sk-ant-…', 'jetpack-starter-plugin' ) }
						help={ __( 'Your API key will be stored securely', 'jetpack-starter-plugin' ) }
					/>

					<Button
						variant="primary"
						onClick={ handleSave }
						isBusy={ isSaving }
						disabled={ isSaving }
					>
						{ __( 'Save API Key', 'jetpack-starter-plugin' ) }
					</Button>
				</div>

				<div className="jetpack-ai-poc-admin__section">
					<h2>{ __( 'About', 'jetpack-starter-plugin' ) }</h2>
					<p>
						{ __(
							"This plugin demonstrates AI-powered WordPress actions using Anthropic's Claude API with Neuron AI agentic implementation. It uses WordPress abilities as tools for the AI agent.",
							'jetpack-starter-plugin'
						) }
					</p>
					<p>
						{ __(
							'Visit the My Jetpack page to access the AI assistant bubble.',
							'jetpack-starter-plugin'
						) }
					</p>
				</div>
			</div>
		</div>
	);
};

export default AdminApp;
