import { Notice } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { RegenerationReason } from '$features/critical-css';

const getSuggestionMessage = ( type: RegenerationReason | null ) => {
	let message;
	if ( 'page_saved' === type ) {
		message = __(
			"We noticed you've recently published a new page on your site that may affect its HTML/CSS structure.",
			'jetpack-boost'
		);
	} else if ( 'post_saved' === type ) {
		message = __(
			"We noticed you've recently published a new post on your site that may affect its HTML/CSS structure.",
			'jetpack-boost'
		);
	} else if ( 'switched_theme' === type ) {
		message = __(
			"We noticed you've recently updated your theme that may affect your site's HTML/CSS structure.",
			'jetpack-boost'
		);
	} else if ( 'plugin_change' === type ) {
		message = __(
			"We noticed you've recently updated a plugin that may affect your site's HTML/CSS structure.",
			'jetpack-boost'
		);
	} else {
		message = __(
			'We noticed some updates to your site that may have changed your HTML/CSS structure.',
			'jetpack-boost'
		);
	}

	return message;
};

type Props = {
	regenerateReason: RegenerationReason | null;
};

export const RegenerateCriticalCssSuggestion = ( { regenerateReason }: Props ) => {
	if ( ! regenerateReason ) {
		return null;
	}

	return (
		<Notice
			level="info"
			title={ __( 'Regenerate Critical CSS', 'jetpack-boost' ) }
			hideCloseButton={ true }
		>
			<p>{ getSuggestionMessage( regenerateReason ) }</p>
			<p>
				{ __(
					'Please regenerate your Critical CSS to maintain optimal site performance.',
					'jetpack-boost'
				) }
			</p>
		</Notice>
	);
};
