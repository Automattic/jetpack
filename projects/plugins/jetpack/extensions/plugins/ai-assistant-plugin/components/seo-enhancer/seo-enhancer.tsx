/**
 * External dependencies
 */
import {
	BaseControl,
	ToggleControl,
	Button,
	PanelRow,
	Card,
	CardBody,
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
			label: __( 'Meta title', 'jetpack' ),
			checked: true,
		},
		{
			name: 'seo-meta-description',
			label: __( 'Meta description', 'jetpack' ),
			checked: true,
		},
		{
			name: 'images-alt-text',
			label: __( 'Image alt text', 'jetpack' ),
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
					<ToggleControl
						checked={ isEnabled }
						disabled={ isToggling }
						onChange={ toggleSeoEnhancer }
						label={ __( 'Auto-fill missing metatags', 'jetpack' ) }
						__nextHasNoMarginBottom={ true }
						help={ __(
							"Automattically generate SEO title, SEO description and images' alt text before publishing.",
							'jetpack'
						) }
					/>
				</BaseControl>
			</PanelRow>
			<PanelRow className="jetpack-seo-sidebar__feature-section">
				<Card size="small">
					<CardBody size="small">
						<BaseControl __nextHasNoMarginBottom={ true }>
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
						</BaseControl>
					</CardBody>
				</Card>
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
						{ __( 'Generate SEO properties', 'jetpack' ) }
					</Button>
				</BaseControl>
			</PanelRow>
		</>
	);
}
