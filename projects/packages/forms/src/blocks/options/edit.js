import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import clsx from 'clsx';
import { useSyncedAttributes } from '../shared/hooks/use-synced-attributes';
import useVariationStyleProperties from '../shared/hooks/use-variation-style-properties.js';

const SYNCED_ATTRIBUTE_KEYS = [ 'backgroundColor', 'borderColor', 'style', 'textColor' ];

const OptionsEdit = ( { clientId, name, context, attributes, setAttributes } ) => {
	const { 'jetpack/field-share-attributes': isSynced } = context;
	useSyncedAttributes( name, isSynced, SYNCED_ATTRIBUTE_KEYS, attributes, setAttributes );
	const variationProps = useVariationStyleProperties( {
		clientId,
		inputBlockName: name,
		inputBlockAttributes: attributes,
	} );

	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field-multiple__list', variationProps?.className ),
		style: variationProps?.cssVars,
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ `jetpack/option` ],
		defaultBlock: `jetpack/option`,
		template: [ [ `jetpack/option` ] ],
		templateInsertUpdatesSelection: true,
		templateLock: false,
	} );

	return <ul { ...innerBlocksProps } />;
};

export default OptionsEdit;
