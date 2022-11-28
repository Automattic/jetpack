import { CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { withSeoHelper } from './with-seo-helper';

const SeoNoindexPanel = ( { metaValue, updateMetaValue } ) => {
	const onCheckboxChange = value => {
		updateMetaValue( value );
	};

	return (
		<CheckboxControl
			label={ __( 'Hide page from search engines', 'jetpack' ) }
			help={ __(
				"If selected, a 'noindex' tag will help instruct search engines to not include this page in search results. This page will also be removed from the Jetpack sitemap.",
				'jetpack'
			) }
			checked={ !! metaValue }
			onChange={ onCheckboxChange }
		/>
	);
};

export default withSeoHelper( 'jetpack_seo_noindex' )( SeoNoindexPanel );
