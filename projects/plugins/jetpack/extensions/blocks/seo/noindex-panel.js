import { CheckboxControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React from 'react';

const SeoNoindexPanel = () => {
	const { postMeta } = useSelect( select => {
		return {
			postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
		};
	} );
	const { editPost } = useDispatch( 'core/editor', [ postMeta.jetpack_seo_noindex ] );

	return (
		<CheckboxControl
			label={ __( 'Hide page from search engines', 'jetpack' ) }
			help={ __(
				"If selected, a 'noindex' tag will help instruct search engines to not include this page in search results. This page will also be removed from the Jetpack sitemap.",
				'jetpack'
			) }
			checked={ !! postMeta.jetpack_seo_noindex }
			onChange={ value => editPost( { meta: { jetpack_seo_noindex: value } } ) }
		/>
	);
};

export default SeoNoindexPanel;
