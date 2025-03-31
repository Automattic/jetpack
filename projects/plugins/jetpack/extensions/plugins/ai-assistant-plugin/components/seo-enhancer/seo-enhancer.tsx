/**
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import {
	BaseControl,
	ToggleControl,
	Button,
	PanelRow,
	CheckboxControl,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { FEATURE_LABELS, FEATURES } from './constants';
import { store } from './store';
import { useSeoModuleSettings } from './use-seo-module-settings';
import { useSeoRequests } from './use-seo-requests';
import './style.scss';
/**
 * Types
 */
const debug = debugFactory( 'seo-enhancer:index' );

export function SeoEnhancer( {
	disableAutoEnhance = false,
	placement = null,
}: {
	disableAutoEnhance?: boolean;
	placement?: 'jetpack-sidebar' | 'jetpack-prepublish-sidebar';
} ) {
	const { tracks } = useAnalytics();
	const { isEnabled, toggleEnhancer, isToggling } = useSeoModuleSettings();
	const isLoading = useSelect( select => {
		const isBusy = select( store ).isBusy();
		const isAnyImageBusy = select( store ).isAnyImageBusy();

		return isBusy || isAnyImageBusy;
	}, [] );
	const enabledFeatures = useSelect( select => select( store ).getEnabledFeatures(), [] );
	const { setFeatureEnabled } = useDispatch( store );

	const { updateSeoData } = useSeoRequests();

	const toggleSeoEnhancer = useCallback( async () => {
		await toggleEnhancer( { placement } );
	}, [ toggleEnhancer, placement ] );

	const toggleFeature = useCallback(
		name => {
			const isFeatureEnabled = enabledFeatures.includes( name );
			tracks.recordEvent( 'jetpack_seo_enhancer_feature_toggle', {
				feature: name,
				toggled: ! isFeatureEnabled ? 'on' : 'off',
				placement,
			} );
			setFeatureEnabled( name, ! isFeatureEnabled );
		},
		[ enabledFeatures, setFeatureEnabled, tracks, placement ]
	);

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
					{ ! disableAutoEnhance && (
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
					) }
				</BaseControl>
			</PanelRow>
			<PanelRow className="jetpack-seo-sidebar__feature-section">
				<BaseControl __nextHasNoMarginBottom={ true }>
					{ ( ! isEnabled || disableAutoEnhance ) && (
						<div className="feature-checkboxes-container">
							{ FEATURES.map( feature => (
								<CheckboxControl
									key={ feature }
									label={ FEATURE_LABELS[ feature ] }
									checked={ enabledFeatures.includes( feature ) }
									onChange={ () => toggleFeature( feature ) }
									__nextHasNoMarginBottom={ true }
									disabled={ isLoading }
									className={ isLoading ? 'is-disabled' : '' }
								/>
							) ) }
						</div>
					) }
					{ isEnabled && ! disableAutoEnhance && (
						<div className="jetpack-seo-sidebar__feature-list-container">
							{ enabledFeatures.length > 0 ? (
								<>
									<p>{ __( "We'll auto-generate:", 'jetpack' ) }</p>
									<ul className="jetpack-seo-sidebar__feature-list">
										{ enabledFeatures.map( feature => (
											<li key={ feature }>{ FEATURE_LABELS[ feature ] }</li>
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
			{ ! isEnabled && (
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
			) }
		</>
	);
}
