/**
 * External dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { PanelRow, Button, BaseControl, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, check, closeSmall } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { FEATURE_LABELS, FEATURES } from './constants';
import { store as seoEnhancerStore } from './store';
import './style.scss';
/**
 * Types
 */
import type { PromptType } from './types';
import type { Block } from '@automattic/jetpack-ai-client';

export function SeoSummary( { onEdit }: { onEdit: () => void } ) {
	const { title, description } = useSelect( select => {
		const meta = select( editorStore ).getEditedPostAttribute( 'meta' );

		return {
			title: meta?.jetpack_seo_html_title ?? '',
			description: meta?.advanced_seo_description ?? '',
		};
	}, [] );

	const { titleBusy, descriptionBusy, imageBusy } = useSelect( select => {
		const { isTitleBusy, isDescriptionBusy, isAnyImageBusy } = select( seoEnhancerStore );

		return {
			titleBusy: isTitleBusy(),
			descriptionBusy: isDescriptionBusy(),
			imageBusy: isAnyImageBusy(),
		};
	}, [] );

	const { getBlocksByName, getBlock } = useSelect(
		select =>
			select( blockEditorStore ) as {
				getBlocksByName: ( name: string ) => string[];
				getBlock: ( id: string ) => Block;
			},
		[]
	);

	const [ allImagesHaveAltText, setAllImagesHaveAltText ] = useState( false );

	const [ imageAltTextHelpText, setImageAltTextHelpText ] = useState( null );

	const seoTitleHelpText = useMemo( () => {
		return title
			? title
			: __( 'No title found. Add it for better search engine visibility.', 'jetpack' );
	}, [ title ] );

	const seoDescriptionHelpText = useMemo( () => {
		return description
			? description
			: __( 'No description found. Add it for better search engine visibility.', 'jetpack' );
	}, [ description ] );

	useEffect( () => {
		if ( ! imageBusy ) {
			const imageBlockIds = getBlocksByName( 'core/image' );

			if ( imageBlockIds.length === 0 ) {
				setImageAltTextHelpText( __( 'No images in the post.', 'jetpack' ) );

				setAllImagesHaveAltText( true );
			} else {
				const imageBlocks = imageBlockIds.map( blockId => getBlock( blockId ) );
				const imageBlocksWithAltText = imageBlocks.filter( block => block.attributes.alt );

				if ( imageBlocksWithAltText.length === imageBlockIds.length ) {
					setImageAltTextHelpText(
						// Translators: %d is the number of images.
						sprintf( __( 'Alt text added to all %d images', 'jetpack' ), imageBlockIds.length )
					);

					setAllImagesHaveAltText( true );
				} else {
					setImageAltTextHelpText(
						sprintf(
							// Translators: %1$d is the number of images with alt text, %2$d is the total number of images.
							__( 'Alt text added to %1$d of %2$d images', 'jetpack' ),
							imageBlocksWithAltText.length,
							imageBlockIds.length
						)
					);

					setAllImagesHaveAltText( false );
				}
			}
		}
	}, [ getBlock, getBlocksByName, imageBusy ] );

	const helpTexts = useMemo( () => {
		return {
			'seo-title': titleBusy ? null : seoTitleHelpText,
			'seo-meta-description': descriptionBusy ? null : seoDescriptionHelpText,
			'images-alt-text': imageBusy ? null : imageAltTextHelpText,
		};
	}, [
		descriptionBusy,
		imageAltTextHelpText,
		imageBusy,
		seoDescriptionHelpText,
		seoTitleHelpText,
		titleBusy,
	] );

	const getIcon = ( feature: PromptType ) => {
		if ( feature === 'seo-title' ) {
			if ( titleBusy ) {
				return <Spinner />;
			}

			if ( title ) {
				return check;
			}
		}

		if ( feature === 'seo-meta-description' ) {
			if ( descriptionBusy ) {
				return <Spinner />;
			}

			if ( description ) {
				return check;
			}
		}

		if ( feature === 'images-alt-text' ) {
			if ( imageBusy ) {
				return <Spinner />;
			}

			if ( allImagesHaveAltText ) {
				return check;
			}
		}

		return closeSmall;
	};

	return (
		<>
			<PanelRow className="jetpack-seo-sidebar__feature-section jetpack-seo-sidebar__feature-section--toggle">
				<BaseControl
					__nextHasNoMarginBottom={ true }
					className="ai-seo-enhancer-toggle"
					help={ __( 'Want to fine-tune this metadata further?', 'jetpack' ) }
					label={ __( 'Metadata', 'jetpack' ) }
					id="jetpack-seo-enhancer-generated-metadata"
				>
					{ FEATURES.map( feature => (
						<div key={ feature } className="jetpack-seo-enhancer-summary-feature">
							<div className="jetpack-seo-enhancer-summary-feature__icon-container">
								<Icon
									className="jetpack-seo-enhancer-summary-feature__icon"
									icon={ getIcon( feature ) }
								/>
							</div>

							<BaseControl
								className="jetpack-seo-enhancer-summary-feature__control"
								key={ feature }
								label={ FEATURE_LABELS[ feature ] }
								id={ feature }
								help={ helpTexts[ feature ] }
								__nextHasNoMarginBottom={ true }
							>
								{ null }
							</BaseControl>
						</div>
					) ) }
				</BaseControl>

				<Button
					variant="secondary"
					__next40pxDefaultSize
					className="jetpack-seo-enhancer-summary__edit-button"
					onClick={ onEdit }
				>
					{ __( 'Edit SEO metadata', 'jetpack' ) }
				</Button>
			</PanelRow>
		</>
	);
}
