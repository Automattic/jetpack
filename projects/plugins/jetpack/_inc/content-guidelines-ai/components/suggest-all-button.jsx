import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { STORE_NAME, VALID_SECTIONS } from '../constants';
import { suggestGuidelines } from '../lib/api';

const config = window.jetpackContentGuidelinesAiConfig || {};

export default function SuggestAllButton() {
	const [ loading, setLoading ] = useState( false );
	const { setGuideline } = useDispatch( STORE_NAME );
	const { createErrorNotice, createWarningNotice, createSuccessNotice } =
		useDispatch( noticesStore );

	const allGuidelines = useSelect( select => {
		const store = select( STORE_NAME );
		return Object.fromEntries( VALID_SECTIONS.map( slug => [ slug, store.getGuideline( slug ) ] ) );
	}, [] );

	const allEmpty = VALID_SECTIONS.every( slug => ! allGuidelines[ slug ] );
	const label = allEmpty
		? __( 'Generate guidelines', 'jetpack' )
		: __( 'Improve guidelines', 'jetpack' );

	const handleClick = useCallback( async () => {
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
			const existingContent = Object.fromEntries(
				VALID_SECTIONS.filter( slug => allGuidelines[ slug ] ).map( slug => [
					slug,
					allGuidelines[ slug ],
				] )
			);

			const response = await suggestGuidelines( VALID_SECTIONS, existingContent );
			const suggestions = response?.suggestions || {};

			let appliedCount = 0;
			for ( const slug of VALID_SECTIONS ) {
				if ( suggestions[ slug ] ) {
					setGuideline( slug, suggestions[ slug ] );
					appliedCount++;
				}
			}

			if ( appliedCount > 0 ) {
				createSuccessNotice(
					__( 'Guidelines generated. Review and save each section.', 'jetpack' ),
					{ type: 'snackbar' }
				);
			}
		} catch {
			createErrorNotice( __( 'Failed to generate guidelines. Please try again.', 'jetpack' ), {
				type: 'snackbar',
			} );
		} finally {
			setLoading( false );
		}
	}, [ allGuidelines, setGuideline, createErrorNotice, createWarningNotice, createSuccessNotice ] );

	return (
		<Button
			variant="primary"
			onClick={ handleClick }
			disabled={ loading }
			isBusy={ loading }
			className="jetpack-content-guidelines-ai__suggest-all-button"
		>
			{ loading ? __( 'Generating\u2026', 'jetpack' ) : label }
		</Button>
	);
}
