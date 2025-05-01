import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { useSyncedAttributes } from '../shared/hooks/use-synced-attributes';

const SYNCED_ATTRIBUTE_KEYS = [ 'borderColor', 'style' ];

const OptionsEdit = ( { attributes, name, setAttributes, context } ) => {
	useSyncedAttributes(
		'jetpack/input',
		context?.[ 'jetpack/field-share-attributes' ],
		SYNCED_ATTRIBUTE_KEYS,
		attributes,
		setAttributes
	);
	console.log( 'OptionsEdit', { attributes, context } );
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
