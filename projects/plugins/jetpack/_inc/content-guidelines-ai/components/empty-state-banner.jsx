import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_NAME, VALID_SECTIONS } from '../constants';
import useGenerateAll from '../hooks/use-generate-all';
import { AI_STORE_NAME } from '../store';

export default function EmptyStateBanner() {
	const { generate, loading } = useGenerateAll();

	const allEmpty = useSelect( select => {
		const store = select( STORE_NAME );
		return VALID_SECTIONS.every( slug => ! store.getGuideline( slug ) );
	}, [] );

	const hasSuggestions = useSelect(
		select => VALID_SECTIONS.some( slug => select( AI_STORE_NAME ).hasSuggestion( slug ) ),
		[]
	);

	// Hide when guidelines exist, suggestions are pending, or generation is in progress.
	if ( ! allEmpty || hasSuggestions || loading ) {
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
						onClick={ generate }
					>
						{ __( 'Get started', 'jetpack' ) }
					</Button>
				</div>
			</div>
			<div className="jetpack-content-guidelines-ai__banner-orb jetpack-content-guidelines-ai__banner-orb--top" />
			<div className="jetpack-content-guidelines-ai__banner-orb jetpack-content-guidelines-ai__banner-orb--bottom" />
		</div>
	);
}
