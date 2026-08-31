import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withSeoHelper } from './with-seo-helper';

const SCHEMA_OPTIONS = [
	{ label: __( 'Default', 'jetpack' ), value: '' },
	{ label: __( 'Article', 'jetpack' ), value: 'article' },
	{ label: __( 'FAQ', 'jetpack' ), value: 'faq' },
];

const SeoSchemaPanel = ( { metaValue, updateMetaValue } ) => (
	<SelectControl
		label={ __( 'Schema type', 'jetpack' ) }
		help={ __(
			'Controls the JSON-LD structured data emitted for this post. Leave on Default to infer from the post type.',
			'jetpack'
		) }
		value={ metaValue || '' }
		options={ SCHEMA_OPTIONS }
		onChange={ updateMetaValue }
		__next40pxDefaultSize={ true }
		__nextHasNoMarginBottom={ true }
	/>
);

export default withSeoHelper( 'jetpack_seo_schema_type' )( SeoSchemaPanel );
