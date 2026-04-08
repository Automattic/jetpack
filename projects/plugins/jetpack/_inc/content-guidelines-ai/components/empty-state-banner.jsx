import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { STORE_NAME, VALID_SECTIONS } from '../constants';
import useGenerateAll from '../hooks/use-generate-all';

const DISMISS_KEY = 'jetpack_content_guidelines_banner_dismissed';

export default function EmptyStateBanner() {
	const { generate } = useGenerateAll();

	const [ dismissed, setDismissed ] = useState( () => localStorage.getItem( DISMISS_KEY ) === '1' );

	const allEmpty = useSelect( select => {
		const store = select( STORE_NAME );
		return VALID_SECTIONS.every( slug => ! store.getGuideline( slug ) );
	}, [] );

	const handleDismiss = useCallback( () => {
		setDismissed( true );
		localStorage.setItem( DISMISS_KEY, '1' );
	}, [] );

	const handleGetStarted = useCallback( () => {
		handleDismiss();
		generate();
	}, [ handleDismiss, generate ] );

	// Hide when explicitly dismissed or when guidelines exist.
	if ( dismissed || ! allEmpty ) {
		return null;
	}

	return (
		<div className="jetpack-content-guidelines-ai__banner">
			<div className="jetpack-content-guidelines-ai__banner-content">
				<h2>{ __( 'Generate your guidelines in seconds', 'jetpack' ) }</h2>
				<p>
					{ __(
						'Use Jetpack to analyze your site and create draft guidelines based on your actual content.',
						'jetpack'
					) }
				</p>
				<div className="jetpack-content-guidelines-ai__banner-actions">
					<Button
						className="jetpack-content-guidelines-ai__banner-cta"
						variant="primary"
						onClick={ handleGetStarted }
					>
						{ __( 'Get started', 'jetpack' ) }
					</Button>
					<Button
						className="jetpack-content-guidelines-ai__banner-close-text"
						variant="tertiary"
						onClick={ handleDismiss }
					>
						{ __( 'Close', 'jetpack' ) }
					</Button>
				</div>
			</div>
			<Button
				className="jetpack-content-guidelines-ai__banner-close"
				icon={ closeSmall }
				label={ __( 'Dismiss banner', 'jetpack' ) }
				size="small"
				onClick={ handleDismiss }
			/>
			<div className="jetpack-content-guidelines-ai__banner-orb jetpack-content-guidelines-ai__banner-orb--top" />
			<div className="jetpack-content-guidelines-ai__banner-orb jetpack-content-guidelines-ai__banner-orb--bottom" />
		</div>
	);
}
