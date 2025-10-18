import apiFetch from '@wordpress/api-fetch';
import { Button, Spinner } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './AIPopup.scss';

const AIPopup = ( { onClose } ) => {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ response, setResponse ] = useState( null );
	const [ error, setError ] = useState( null );

	const handleAction = async action => {
		setIsLoading( true );
		setResponse( null );
		setError( null );

		const prompts = {
			'enable-security': 'Enable site security features (Account Protection and Downtime Monitor)',
			'disable-security':
				'Disable site security features (Account Protection and Downtime Monitor)',
		};

		try {
			const result = await apiFetch( {
				path: '/jetpack-ai-poc/v1/agent',
				method: 'POST',
				data: {
					prompt: prompts[ action ],
				},
			} );

			if ( result.success ) {
				setResponse( result.message );
			} else {
				setError( result.message || __( 'Failed to execute action', 'jetpack-starter-plugin' ) );
			}
		} catch ( err ) {
			setError(
				err.message ||
					__( 'An error occurred while processing your request', 'jetpack-starter-plugin' )
			);
		} finally {
			setIsLoading( false );
		}
	};

	return (
		<div className="jetpack-ai-poc-popup-overlay" onClick={ onClose }>
			<div className="jetpack-ai-poc-popup" onClick={ e => e.stopPropagation() }>
				<div className="jetpack-ai-poc-popup__header">
					<h2>{ __( 'AI Assistant', 'jetpack-starter-plugin' ) }</h2>
					<button
						className="jetpack-ai-poc-popup__close"
						onClick={ onClose }
						aria-label={ __( 'Close', 'jetpack-starter-plugin' ) }
					>
						×
					</button>
				</div>

				<div className="jetpack-ai-poc-popup__content">
					<p>
						{ __(
							'Use AI to perform actions on your site. Choose an action below:',
							'jetpack-starter-plugin'
						) }
					</p>

					<div className="jetpack-ai-poc-popup__actions">
						<Button
							variant="primary"
							onClick={ () => handleAction( 'enable-security' ) }
							disabled={ isLoading }
						>
							{ __( 'Enable Site Security', 'jetpack-starter-plugin' ) }
						</Button>

						<Button
							variant="secondary"
							onClick={ () => handleAction( 'disable-security' ) }
							disabled={ isLoading }
						>
							{ __( 'Disable Site Security', 'jetpack-starter-plugin' ) }
						</Button>
					</div>

					{ isLoading && (
						<div className="jetpack-ai-poc-popup__loading">
							<Spinner />
							<p>{ __( 'Processing your request…', 'jetpack-starter-plugin' ) }</p>
						</div>
					) }

					{ response && (
						<div className="jetpack-ai-poc-popup__response jetpack-ai-poc-popup__response--success">
							<h3>{ __( 'Response:', 'jetpack-starter-plugin' ) }</h3>
							<p>{ response }</p>
						</div>
					) }

					{ error && (
						<div className="jetpack-ai-poc-popup__response jetpack-ai-poc-popup__response--error">
							<h3>{ __( 'Error:', 'jetpack-starter-plugin' ) }</h3>
							<p>{ error }</p>
						</div>
					) }
				</div>
			</div>
		</div>
	);
};

export default AIPopup;
