import {
	BaseControl,
	ToggleControl,
	Button,
	PanelRow,
	Card,
	CardBody,
	CheckboxControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from 'react';
import './style.scss';

export function SeoEnhancer() {
	const [ isEnabled, setIsEnabled ] = useState( true );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ features, setFeatures ] = useState( [
		{
			name: 'meta-title',
			label: __( 'Meta title', 'jetpack' ),
			checked: true,
		},
		{
			name: 'meta-description',
			label: __( 'Meta description', 'jetpack' ),
			checked: true,
		},
		{
			name: 'image-alt-text',
			label: __( 'Image alt text', 'jetpack' ),
			checked: true,
		},
	] );

	const toggleFeature = useCallback( name => {
		setFeatures( prevFeatures =>
			prevFeatures.map( feature =>
				feature.name === name ? { ...feature, checked: ! feature.checked } : feature
			)
		);
	}, [] );

	const toggleHandler = () => {
		setIsEnabled( ! isEnabled );
	};

	const generateHandler = () => {
		setIsLoading( true );

		setTimeout( () => {
			setIsLoading( false );
		}, 3000 );
	};

	return (
		<>
			<PanelRow className="jetpack-seo-sidebar__feature-section jetpack-seo-sidebar__feature-section--toggle">
				<BaseControl __nextHasNoMarginBottom={ true } className="ai-seo-enhancer-toggle">
					<ToggleControl
						checked={ isEnabled }
						onChange={ toggleHandler }
						label={ __( 'Auto-enhance', 'jetpack' ) }
						__nextHasNoMarginBottom={ true }
						help={
							! isEnabled
								? __(
										"Automattically generate SEO title, SEO description and images' alt text before publishing.",
										'jetpack'
								  )
								: null
						}
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
