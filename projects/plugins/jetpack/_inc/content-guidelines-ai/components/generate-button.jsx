import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { STORE_NAME } from '../constants';
import { suggestGuidelines } from '../lib/api';

const config = window.jetpackContentGuidelinesAiConfig || {};

export default function GenerateButton( { slug } ) {
	const [ loading, setLoading ] = useState( false );
	const { setGuideline } = useDispatch( STORE_NAME );
	const { createErrorNotice, createWarningNotice } = useDispatch( noticesStore );
	const draft = useSelect( select => select( STORE_NAME ).getGuideline( slug ), [ slug ] );

	const isEmpty = ! draft;
	const label = isEmpty
		? __( 'Generate with Jetpack', 'jetpack' )
		: __( 'Improve with Jetpack', 'jetpack' );
	const loadingLabel = __( 'Generating\u2026', 'jetpack' );

	const handleGenerate = useCallback( async () => {
		if ( ! config.available ) {
			const message = ! config.isConnected
				? __(
						'Jetpack AI is not available. Connect your site to WordPress.com to get started.',
						'jetpack'
				  )
				: __( 'Upgrade now to start using Jetpack AI.', 'jetpack' );
			const actionLabel = ! config.isConnected
				? __( 'Connect', 'jetpack' )
				: __( 'Upgrade', 'jetpack' );

			createWarningNotice( message, {
				type: 'snackbar',
				actions: config.upgradeUrl ? [ { label: actionLabel, url: config.upgradeUrl } ] : [],
			} );
			return;
		}

		setLoading( true );
		try {
			const existingContent = draft ? { [ slug ]: draft } : {};
			const response = await suggestGuidelines( [ slug ], existingContent );
			const suggestion = response?.suggestions?.[ slug ];
			if ( suggestion ) {
				setGuideline( slug, suggestion );
			}
		} catch {
			createErrorNotice( __( 'Failed to generate guidelines. Please try again.', 'jetpack' ), {
				type: 'snackbar',
			} );
		} finally {
			setLoading( false );
		}
	}, [ slug, draft, setGuideline, createErrorNotice, createWarningNotice ] );

	return (
		<Button
			variant="secondary"
			onClick={ handleGenerate }
			disabled={ loading }
			isBusy={ loading }
			className="jetpack-content-guidelines-ai__generate-button"
		>
			{ loading ? loadingLabel : label }
		</Button>
	);
}
