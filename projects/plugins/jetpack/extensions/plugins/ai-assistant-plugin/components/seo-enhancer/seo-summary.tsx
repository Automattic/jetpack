/**
 * External dependencies
 */
import { getAllBlocks } from '@automattic/jetpack-ai-client';
import { PanelRow, Button, BaseControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, check } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { FEATURE_LABELS, FEATURES } from './constants';
import { store as seoEnhancerStore } from './store';
import './style.scss';
/**
 * Types
 */

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

	const [ imageAltTextHelpText, setImageAltTextHelpText ] = useState( null );

	const seoTitleHelpText = useMemo( () => {
		return title ? title : '';
	}, [ title ] );

	const seoDescriptionHelpText = useMemo( () => {
		return description ? description : '';
	}, [ description ] );

	useEffect( () => {
		const imageBlocks = getAllBlocks().filter(
			block => block.name === 'core/image' && block.attributes.url
		);

		if ( imageBlocks.length === 0 ) {
			setImageAltTextHelpText( '' );

			return;
		}

		const imageBlocksWithAlt = imageBlocks.filter( block => !! block.attributes.alt );

		if ( imageBlocksWithAlt.length === 0 ) {
			setImageAltTextHelpText( '' );

			return;
		}

		if ( imageBlocksWithAlt.length === imageBlocks.length ) {
			setImageAltTextHelpText( __( 'Alt text added to all images', 'jetpack' ) );

			return;
		}

		if ( imageBlocksWithAlt.length < imageBlocks.length ) {
			setImageAltTextHelpText(
				sprintf(
					// Translators: %1$d is the number of images with alt text, %2$d is the total number of images.
					__( 'Alt text added to %1$d of %2$d images', 'jetpack' ),
					imageBlocksWithAlt.length,
					imageBlocks.length
				)
			);
		}
	}, [] );

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

	const allHelpTextsEmpty = useMemo( () => {
		return Object.values( helpTexts ).every( text => ! text );
	}, [ helpTexts ] );

	const editMetadataFurtherText = __( 'Want to fine-tune this metadata further?', 'jetpack' );
	const noMetadataText = __(
		'No metadata found. Add it to improve search engine visibility.',
		'jetpack'
	);

	return (
		<>
			<PanelRow className="jetpack-seo-sidebar__feature-section jetpack-seo-sidebar__feature-section--toggle">
				<BaseControl
					__nextHasNoMarginBottom={ true }
					className="ai-seo-enhancer-toggle"
					help={ allHelpTextsEmpty ? noMetadataText : editMetadataFurtherText }
					label={ __( 'Metadata', 'jetpack' ) }
					id="jetpack-seo-enhancer-generated-metadata"
				>
					{ ! allHelpTextsEmpty &&
						FEATURES.map( feature => {
							if ( ! helpTexts[ feature ] ) {
								return null;
							}
							return (
								<div key={ feature } className="jetpack-seo-enhancer-summary-feature">
									<div className="jetpack-seo-enhancer-summary-feature__icon-container">
										<Icon className="jetpack-seo-enhancer-summary-feature__icon" icon={ check } />
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
							);
						} ) }
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
