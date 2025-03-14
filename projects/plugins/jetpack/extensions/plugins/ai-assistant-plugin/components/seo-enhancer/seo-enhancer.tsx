/**
 * External dependencies
 */
import {
	BaseControl,
	ToggleControl,
	Button,
	PanelRow,
	CheckboxControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { store } from './store';
import { useSeoModuleSettings } from './use-seo-module-settings';
import { useSeoRequests } from './use-seo-requests';
import './style.scss';
/**
 * Types
 */
import type { PromptType } from './types';
const debug = debugFactory( 'seo-enhancer:index' );

export function SeoEnhancer() {
	const { isEnabled, toggleEnhancer, isToggling } = useSeoModuleSettings();
	const isLoading = useSelect( select => {
		const isBusy = select( store ).isBusy();
		const isAnyImageBusy = select( store ).isAnyImageBusy();

		return isBusy || isAnyImageBusy;
	}, [] );
	const [ features, setFeatures ] = useState<
		{ name: PromptType; label: string; checked: boolean }[]
	>( [
		{
			name: 'seo-title',
			label: __( 'SEO title', 'jetpack' ),
			checked: true,
		},
		{
			name: 'seo-meta-description',
			label: __( 'SEO description', 'jetpack' ),
			checked: true,
		},
		{
			name: 'images-alt-text',
			label: __( 'Alt text for images', 'jetpack' ),
			checked: true,
		},
	] );
	const { updateSeoData } = useSeoRequests(
		features.filter( feature => feature.checked ).map( feature => feature.name )
	);

	const toggleSeoEnhancer = useCallback( async () => {
		await toggleEnhancer();
	}, [ toggleEnhancer ] );

	const toggleFeature = useCallback( name => {
		setFeatures( prevFeatures =>
			prevFeatures.map( feature =>
				feature.name === name ? { ...feature, checked: ! feature.checked } : feature
			)
		);
	}, [] );

	const generateHandler = async () => {
		try {
			await updateSeoData();
		} catch ( error ) {
			debug( 'Error generating SEO data', error );
		}
	};

	return (
		<>
			<PanelRow className="jetpack-seo-sidebar__feature-section jetpack-seo-sidebar__feature-section--toggle">
				<BaseControl __nextHasNoMarginBottom={ true } className="ai-seo-enhancer-toggle">
					<BaseControl.VisualLabel className="ai-seo-enhancer-label">
						{ __( 'Metadata AI Generator', 'jetpack' ) }
					</BaseControl.VisualLabel>
					<ToggleControl
						checked={ isEnabled }
						disabled={ isToggling }
						onChange={ toggleSeoEnhancer }
						label={ __( 'Auto-generate metadata', 'jetpack' ) }
						__nextHasNoMarginBottom={ true }
						help={ __(
							'When enabled, missing metadata will be automatically generated when you publish a post.',
							'jetpack'
						) }
					/>
				</BaseControl>
			</PanelRow>
			<PanelRow className="jetpack-seo-sidebar__feature-section">
				<BaseControl __nextHasNoMarginBottom={ true }>
					{ ! isEnabled && (
						<div className="feature-checkboxes-container">
							{ features.map( feature => (
								<CheckboxControl
									key={ feature.name }
									label={ feature.label }
									checked={ feature.checked }
									onChange={ () => toggleFeature( feature.name ) }
									__nextHasNoMarginBottom={ true }
									disabled={ isLoading }
									className={ isLoading ? 'is-disabled' : '' }
								/>
							) ) }
						</div>
					) }
					{ isEnabled && (
						<div className="jetpack-seo-sidebar__feature-list-container">
							{ features.some( feature => feature.checked ) ? (
								<>
									<p>{ __( "We'll auto-generate:", 'jetpack' ) }</p>
									<ul className="jetpack-seo-sidebar__feature-list">
										{ features
											.filter( feature => feature.checked )
											.map( feature => (
												<li key={ feature.name }>{ feature.label }</li>
											) ) }
									</ul>
								</>
							) : (
								<p>{ __( 'No features selected to auto-generate', 'jetpack' ) }</p>
							) }
						</div>
					) }
				</BaseControl>
			</PanelRow>
			<PanelRow className="jetpack-seo-sidebar__feature-section">
				<BaseControl __nextHasNoMarginBottom={ true } className="ai-seo-enhancer-toggle">
					<Button
						isBusy={ isLoading }
						disabled={ isLoading }
						onClick={ generateHandler }
						variant="secondary"
						__next40pxDefaultSize
					>
						{ __( 'Generate metadata', 'jetpack' ) }
					</Button>
				</BaseControl>
			</PanelRow>
		</>
	);
}
