import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import clsx from 'clsx';
import useFormStyleOutlineClassesAndStyles from '../shared/hooks/use-form-style-outline-classes-and-styles.js';
import { useSyncedAttributes } from '../shared/hooks/use-synced-attributes';

const SYNCED_ATTRIBUTE_KEYS = [ 'backgroundColor', 'borderColor', 'style', 'textColor' ];

const OptionsEdit = ( { clientId, name, context, attributes, setAttributes } ) => {
	const { 'jetpack/field-share-attributes': isSynced } = context;
	useSyncedAttributes( name, isSynced, SYNCED_ATTRIBUTE_KEYS, attributes, setAttributes );
	useSyncedAttributes(
		'jetpack/input',
		isSynced,
		SYNCED_ATTRIBUTE_KEYS,
		attributes,
		setAttributes
	);
	const styles = useFormStyleOutlineClassesAndStyles( {
		clientId,
		inputBlockName: name,
		inputBlockAttributes: attributes,
	} );
	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field-multiple__list', {
			'jetpack-field-multiple__list--has-border':
				!! attributes?.style?.border?.width || !! attributes?.style?.border?.left?.width,
		} ),
		style: styles?.cssVars,
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
