import {
	InnerBlocks,
	__experimentalBlockPatternSetup as BlockPatternSetup, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { cloneBlock, createBlock, getBlockType, registerBlockVariation } from '@wordpress/blocks';
import { Button, Modal, Placeholder } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { get } from 'lodash';
import PaymentsIntroBlockPicker from './block-picker';
import defaultVariations from './variations';

const JetpackPatternPicker = function ( { onBlockPatternSelect } ) {
	const [ isPatternSelectionModalOpen, setIsPatternSelectionModalOpen ] = useState( false );

	const patternFilter = pattern => {
		return pattern.categories.includes( 'earn' );
	};

	return (
		<>
			<Button
				variant="primary"
				onClick={ () => setIsPatternSelectionModalOpen( true ) }
				className="wp-payments-intro-pattern-picker__opener"
			>
				{ __( 'Choose a pattern', 'jetpack' ) }
			</Button>
			{ isPatternSelectionModalOpen && (
				<Modal
					title={ __( 'Choose a pattern', 'jetpack' ) }
					closeLabel={ __( 'Cancel', 'jetpack' ) }
					onRequestClose={ () => setIsPatternSelectionModalOpen( false ) }
				>
					<BlockPatternSetup
						onBlockPatternSelect={ onBlockPatternSelect }
						filterPatternsFn={ patternFilter }
					/>
				</Modal>
			) }
		</>
	);
};

export default function JetpackPaymentsIntroEdit( { name, clientId, className } ) {
	const { blockType, hasInnerBlocks } = useSelect( select => {
		const { getBlocks } = select( blockEditorStore );

		return {
			blockType: getBlockType( name ),
			hasInnerBlocks: getBlocks( clientId )?.length > 0,
		};
	} );

	const { replaceBlock, selectBlock } = useDispatch( blockEditorStore );

	const setVariation = variation => {
		replaceBlock( clientId, createBlock( variation.name ) );
		selectBlock( clientId );
	};

	const usableVariations = defaultVariations.filter( variation => getBlockType( variation.name ) );

	useEffect( () => {
		// Populate default variation on older versions of WP or GB that don't support variations.
		if ( ! hasInnerBlocks && ! registerBlockVariation ) {
			setVariation( usableVariations[ 0 ] );
		}
	} );

	if ( ! hasInnerBlocks && registerBlockVariation ) {
		return (
			<Placeholder
				icon={ get( blockType, [ 'icon', 'src' ] ) }
				label={ get( blockType, [ 'title' ] ) }
				instructions={ __( 'Start by choosing one of our suggested layout patterns', 'jetpack' ) }
				className={ className }
			>
				<JetpackPatternPicker
					onBlockPatternSelect={ blocks => {
						const clonedBlocks = blocks.map( block => cloneBlock( block ) );
						replaceBlock( clientId, clonedBlocks );
					} }
				/>
				<p>{ __( 'Or use one of our blocks to create your own', 'jetpack' ) }</p>
				<PaymentsIntroBlockPicker
					label={ __( 'Payment Block list', 'jetpack' ) }
					variations={ usableVariations }
					onSelect={ ( nextVariation = usableVariations[ 0 ] ) => {
						setVariation( nextVariation );
					} }
				/>
			</Placeholder>
		);
	}

	return <InnerBlocks />;
}
