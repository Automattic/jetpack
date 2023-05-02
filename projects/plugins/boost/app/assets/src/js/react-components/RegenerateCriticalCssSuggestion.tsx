import { Notice } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { suggestRegenerateDS } from '../stores/data-sync-client';

export const RegenerateCriticalCssSuggestion = ( { show } ) => {
	if ( ! show ) {
		return null;
	}

	return (
		<Notice
			level="info"
			title={ __( 'Regenerate Critical CSS', 'jetpack-boost' ) }
			onClose={ () => {
				suggestRegenerateDS.store.set( false );
			} }
			hideCloseButton={ true }
		>
			<p>
				{ __(
					'We noticed some updates to your site that may have changed your HTML/CSS structure.',
					'jetpack-boost'
				) }
			</p>
			<p>
				{ __(
					'Please regenerate your Critical CSS to maintain optimal site performance.',
					'jetpack-boost'
				) }
			</p>
		</Notice>
	);
};
