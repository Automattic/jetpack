/**
 * External dependencies
 */
import { PanelRow, Button, BaseControl, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, check } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { FEATURE_LABELS } from './constants';
import { store as seoEnhancerStore } from './store';
import './style.scss';
/**
 * Types
 */
import { PromptType } from './types';

export function SeoSummary( { onEdit }: { onEdit: () => void } ) {
	const { enabledFeatures, title, description, isTitleBusy, isDescriptionBusy, isAnyImageBusy } =
		useSelect( select => {
			const meta = select( editorStore ).getEditedPostAttribute( 'meta' );
			const features = select( seoEnhancerStore ).getEnabledFeatures();
			const titleBusy = select( seoEnhancerStore ).isTitleBusy();
			const descriptionBusy = select( seoEnhancerStore ).isDescriptionBusy();
			const anyImageBusy = select( seoEnhancerStore ).isAnyImageBusy();

			return {
				enabledFeatures: features,
				title: meta?.jetpack_seo_html_title ?? '',
				description: meta?.advanced_seo_description ?? '',
				isTitleBusy: titleBusy,
				isDescriptionBusy: descriptionBusy,
				isAnyImageBusy: anyImageBusy,
			};
		}, [] );

	const helpTexts = useMemo( () => {
		return {
			'seo-title': title,
			'seo-meta-description': description,
			'images-alt-text': __( 'Alt text added to images', 'jetpack' ),
		};
	}, [ description, title ] );

	const getIcon = ( feature: PromptType ) => {
		if ( feature === 'images-alt-text' ) {
			return isAnyImageBusy ? <Spinner /> : check;
		}

		if ( feature === 'seo-title' ) {
			return isTitleBusy ? <Spinner /> : check;
		}

		if ( feature === 'seo-meta-description' ) {
			return isDescriptionBusy ? <Spinner /> : check;
		}

		return null;
	};

	return (
		<>
			<PanelRow className="jetpack-seo-sidebar__feature-section jetpack-seo-sidebar__feature-section--toggle">
				<BaseControl
					__nextHasNoMarginBottom={ true }
					className="ai-seo-enhancer-toggle"
					help={ __( 'Want to fine-tune this metadata further?', 'jetpack' ) }
					label={ __( 'Generated Metadata', 'jetpack' ) }
					id="jetpack-seo-enhancer-generated-metadata"
				>
					{ enabledFeatures.map( feature => (
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
