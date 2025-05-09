import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { useSyncedAttributes } from '../shared/hooks/use-synced-attributes';

const SYNCED_ATTRIBUTE_KEYS = [ 'backgroundColor', 'borderColor', 'style', 'textColor' ];

const OptionsEdit = ( { name, context, attributes, setAttributes } ) => {
	const { 'jetpack/field-share-attributes': isSynced } = context;
	useSyncedAttributes( name, isSynced, SYNCED_ATTRIBUTE_KEYS, attributes, setAttributes );
	useSyncedAttributes(
		'jetpack/input',
		isSynced,
		SYNCED_ATTRIBUTE_KEYS,
		attributes,
		setAttributes
	);
	const blockProps = useBlockProps( { className: 'jetpack-field-multiple__list' } );
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
