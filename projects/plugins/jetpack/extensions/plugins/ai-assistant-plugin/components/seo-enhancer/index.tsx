import { JETPACK_MODULES_STORE_ID } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import {
	BaseControl,
	ToggleControl,
	Button,
	PanelRow,
	Card,
	CardBody,
	CheckboxControl,
} from '@wordpress/components';
import { select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useState, useCallback, useEffect } from 'react';
import './style.scss';

type JetpackModuleSettings = {
	[ module: string ]: {
		options: {
			[ option: string ]: {
				current_value: boolean;
			};
		};
	};
};

type JetpackModuleSelector = {
	getJetpackModules: () => JetpackModuleSettings;
};

const useSeoModuleSettings = () => {
	const [ isEnabled, setIsEnabled ] = useState( false );
	const [ isToggling, setIsToggling ] = useState( false );

	useEffect( () => {
		const seoModuleSettings = (
			select( JETPACK_MODULES_STORE_ID ) as JetpackModuleSelector
		 ).getJetpackModules()[ 'seo-tools' ];
		const enhancerAvailable =
			seoModuleSettings && 'ai_seo_enhancer_enabled' in seoModuleSettings.options;
		const enhancerEnabled =
			enhancerAvailable && seoModuleSettings.options?.ai_seo_enhancer_enabled?.current_value;

		setIsEnabled( enhancerEnabled );
	}, [] );

	const toggleEnhancer = useCallback( async () => {
		setIsToggling( true );
		apiFetch( {
			path: 'jetpack/v4/module/seo-tools',
			method: 'post',
			data: { ai_seo_enhancer_enabled: ! isEnabled },
		} )
			.then( () => {
				setIsEnabled( ! isEnabled );
			} )
			.catch( () => {
				// handle error
			} )
			.finally( () => {
				setIsToggling( false );
			} );
	}, [ isEnabled ] );

	return {
		isEnabled,
		toggleEnhancer,
		isToggling,
	};
};

export function SeoEnhancer() {
	const { isEnabled, toggleEnhancer, isToggling } = useSeoModuleSettings();
	const [ isLoading, setIsLoading ] = useState( false );
	// const [ isToggling, setIsToggling ] = useState( false );
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
