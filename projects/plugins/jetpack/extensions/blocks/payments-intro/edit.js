import { InnerBlocks, store as blockEditorStore, useBlockProps } from '@wordpress/block-editor';
import { cloneBlock, createBlock, getBlockType, registerBlockVariation } from '@wordpress/blocks';
import { Placeholder } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { get } from 'lodash';
import PaymentsIntroBlockPicker from './block-picker';
import PaymentsIntroPatternPicker from './pattern-picker';
import defaultVariations from './variations';

export default function JetpackPaymentsIntroEdit( { name, clientId } ) {
	const patternFilter = pattern => pattern.categories?.includes( 'shop' );

	const blockProps = useBlockProps();
	const { blockType, hasInnerBlocks, hasPatterns, settings } = useSelect( select => {
		const { getBlocks, __experimentalGetAllowedPatterns, getSettings } = select( blockEditorStore );

		return {
			settings: getSettings(),
			blockType: getBlockType( name ),
			hasInnerBlocks: getBlocks( clientId )?.length > 0,
			hasPatterns: __experimentalGetAllowedPatterns?.().filter( patternFilter ).length > 0,
		};
	} );

	const { replaceBlock, selectBlock, updateSettings } = useDispatch( blockEditorStore );

	const maybeMakeBlockVisible = useCallback(
		blockName => {
			const isBlockAllowed =
				settings?.allowedBlockTypes === true || settings?.allowedBlockTypes?.includes( blockName );
			if ( ! isBlockAllowed ) {
				// Add the block to the allowed block list before rendering
				updateSettings( {
					...settings,
					allowedBlockTypes: [ ...settings.allowedBlockTypes, blockName ],
				} );
			}
		},
		[ settings, updateSettings ]
	);

	const setVariation = variation => {
		const blockName = variation.name;

		maybeMakeBlockVisible( blockName );
		replaceBlock( clientId, createBlock( blockName ) );
		selectBlock( clientId );
	};

	const usableVariations = defaultVariations.filter( variation => getBlockType( variation.name ) );

	useEffect( () => {
		// Populate default variation on older versions of WP or GB that don't support variations.
		if ( ! hasInnerBlocks && ! registerBlockVariation ) {
			setVariation( usableVariations[ 0 ] );
		}
	} );

	const displayVariations = usableVariations.length && registerBlockVariation;

	let instructions = __( "Please select which kind of payment you'd like to add.", 'jetpack' );
	if ( hasPatterns ) {
		instructions = __( 'Start by choosing one of our suggested layout patterns.', 'jetpack' );
	}

	let content;

	if ( ! hasInnerBlocks && displayVariations ) {
		content = (
			<Placeholder
				icon={ get( blockType, [ 'icon', 'src' ] ) }
				label={ get( blockType, [ 'title' ] ) }
				instructions={ instructions }
			>
				{ hasPatterns && (
					<>
						<PaymentsIntroPatternPicker
							onBlockPatternSelect={ blocks => replaceBlock( clientId, blocks.map( cloneBlock ) ) }
							patternFilter={ patternFilter }
						/>
						<p>{ __( 'Or use one of our blocks to create your own.', 'jetpack' ) }</p>
					</>
				) }
				<PaymentsIntroBlockPicker
					label={ __( 'Payment Block list', 'jetpack' ) }
					variations={ usableVariations }
					onSelect={ ( nextVariation = usableVariations[ 0 ] ) => {
						setVariation( nextVariation );
					} }
				/>
			</Placeholder>
		);
	} else {
		content = <InnerBlocks />;
	}

	return <div { ...blockProps }>{ content }</div>;
}
