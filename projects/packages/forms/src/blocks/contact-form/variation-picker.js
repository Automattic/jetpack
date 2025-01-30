import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import {
	__experimentalBlockVariationPicker as BlockVariationPicker, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalBlockPatternSetup as BlockPatternSetup, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock, store as blocksStore } from '@wordpress/blocks';
import { Button, Modal } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { filter, get, map } from 'lodash';
import './util/form-styles.js';

const RESPONSES_PATH = `${ get( getJetpackData(), 'adminUrl', false ) }edit.php?post_type=feedback`;
const CUSTOMIZING_FORMS_URL = 'https://jetpack.com/support/jetpack-blocks/contact-form/';

const createBlocksFromInnerBlocksTemplate = innerBlocksTemplate => {
	const blocks = map( innerBlocksTemplate, ( [ blockName, attr, innerBlocks = [] ] ) =>
		createBlock( blockName, attr, createBlocksFromInnerBlocksTemplate( innerBlocks ) )
	);

	return blocks;
};

export default function VariationPicker( { blockName, setAttributes, clientId, classNames } ) {
	const [ isPatternsModalOpen, setIsPatternsModalOpen ] = useState( false );
	const { replaceInnerBlocks, selectBlock } = useDispatch( blockEditorStore );
	const { blockType, defaultVariation, variations } = useSelect(
		select => {
			const { getBlockType, getBlockVariations, getDefaultBlockVariation } = select( blocksStore );

			return {
				blockType: getBlockType( blockName ),
				defaultVariation: getDefaultBlockVariation( blockName, 'block' ),
				variations: getBlockVariations( blockName, 'block' ),
			};
		},
		[ blockName ]
	);

	useEffect( () => {
		if (
			! isPatternsModalOpen &&
			window.location.search.indexOf( 'showJetpackFormsPatterns' ) !== -1
		) {
			setIsPatternsModalOpen( true );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return (
		<div className={ clsx( classNames, 'is-placeholder' ) }>
			<BlockVariationPicker
				icon={ get( blockType, [ 'icon', 'src' ] ) }
				label={ get( blockType, [ 'title' ] ) }
				instructions={ __(
					'Start building a form by selecting one of these form templates, or search in the patterns library for more forms:',
					'jetpack-forms'
				) }
				variations={ filter( variations, v => ! v.hiddenFromPicker ) }
				onSelect={ ( nextVariation = defaultVariation ) => {
					if ( nextVariation.attributes ) {
						setAttributes( nextVariation.attributes );
					}

					if ( nextVariation.innerBlocks ) {
						replaceInnerBlocks(
							clientId,
							createBlocksFromInnerBlocksTemplate( nextVariation.innerBlocks )
						);
					}

					selectBlock( clientId );
				} }
			/>
			<div className="form-placeholder__footer">
				<Button variant="secondary" onClick={ () => setIsPatternsModalOpen( true ) }>
					{ __( 'Explore Form Patterns', 'jetpack-forms' ) }
				</Button>
				<div className="form-placeholder__footer-links">
					<Button
						variant="link"
						className="form-placeholder__external-link"
						href={ CUSTOMIZING_FORMS_URL }
						target="_blank"
					>
						{ __( 'Learn more about customizing forms', 'jetpack-forms' ) }
					</Button>
					<Button
						variant="link"
						className="form-placeholder__external-link"
						href={ RESPONSES_PATH }
						target="_blank"
					>
						{ __( 'View and export your form responses here', 'jetpack-forms' ) }
					</Button>
				</div>
			</div>
			{ isPatternsModalOpen && (
				<Modal
					className="form-placeholder__patterns-modal"
					title={ __( 'Choose a pattern', 'jetpack-forms' ) }
					closeLabel={ __( 'Cancel', 'jetpack-forms' ) }
					onRequestClose={ () => setIsPatternsModalOpen( false ) }
				>
					<BlockPatternSetup
						initialViewMode="grid"
						filterPatternsFn={ pattern => {
							return pattern.content.indexOf( 'jetpack/contact-form' ) !== -1;
						} }
						clientId={ clientId }
					/>
				</Modal>
			) }
		</div>
	);
}
