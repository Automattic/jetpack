/**
 * External dependencies
 */
import { Block } from '@automattic/jetpack-ai-client';
import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { FEATURE_LABELS, FEATURES } from './constants';
import { store } from './store';
import './style.scss';
/**
 * Types
 */
import type { PromptType } from './types';

export function SeoEnhancerTaskList( {
	isPrePublish,
}: {
	isPrePublish: boolean;
	imageBlocks: Block[];
} ) {
	const { titleBusy, descriptionBusy, imageBusy } = useSelect( select => {
		const { isTitleBusy, isDescriptionBusy, isAnyImageBusy } = select( store );

		return {
			titleBusy: isTitleBusy(),
			descriptionBusy: isDescriptionBusy(),
			imageBusy: isAnyImageBusy(),
		};
	}, [] );

	const featureIsBusy = ( feature: PromptType ) => {
		if ( feature === 'seo-title' ) {
			return titleBusy;
		}

		if ( feature === 'seo-meta-description' ) {
			return descriptionBusy;
		}

		if ( feature === 'images-alt-text' ) {
			return imageBusy;
		}

		return false;
	};

	return (
		<div className="jetpack-seo-sidebar__feature-list-container">
			<div className="jetpack-seo-sidebar__feature-list-title">
				{ __( "If not provided we'll automatically generate:", 'jetpack' ) }
			</div>
			<div className="jetpack-seo-sidebar__feature-list">
				{ FEATURES.map( feature => {
					if ( ! isPrePublish ) {
						return (
							<div className="jetpack-seo-enhancer__feature-list-item" key={ feature }>
								<div className="jetpack-seo-enhancer__feature-list-item-icon-container" />
								<div>{ FEATURE_LABELS[ feature ] }</div>
							</div>
						);
					}
					return (
						<div key={ feature } className="jetpack-seo-enhancer__feature-list-item">
							<div className="jetpack-seo-enhancer__feature-list-item-icon-container">
								<Spinner
									style={ {
										marginRight: 0,
										display: featureIsBusy( feature ) ? 'inline-block' : 'none',
									} }
								/>
							</div>
							<div className="jetpack-seo-enhancer__feature-list-item-label">
								{ FEATURE_LABELS[ feature ] }
							</div>
						</div>
					);
				} ) }
			</div>
		</div>
	);
}
