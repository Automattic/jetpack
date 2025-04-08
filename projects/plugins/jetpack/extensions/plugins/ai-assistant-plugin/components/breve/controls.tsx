/**
 * WordPress dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import {
	BaseControl,
	PanelRow,
	CheckboxControl,
	ToggleControl,
	Tooltip,
	Card,
	CardBody,
	CardFooter,
} from '@wordpress/components';
import { compose, useDebounce } from '@wordpress/compose';
import { useDispatch, useSelect, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon, help } from '@wordpress/icons';
/**
 * External dependencies
 */
import React, { useState, useEffect, useCallback } from 'react';
/**
 * Internal dependencies
 */
import features from './features';
import calculateFleschKincaid from './utils/flesch-kincaid-utils';
import { canWriteBriefFeatureBeEnabled } from './utils/get-availability';
import { getPostText } from './utils/get-post-text';
import './breve.scss';
/**
 * Types
 */
import type { BreveSelect } from './types';

export const useInit = init => {
	const [ initialized, setInitialized ] = useState( false );

	if ( ! initialized ) {
		init();
		setInitialized( true );
	}
};

const Controls = ( { blocks, disabledFeatures } ) => {
	const [ gradeLevel, setGradeLevel ] = useState< string | null >( null );
	const { toggleFeature, toggleProofread, setPopoverHover, setHighlightHover, setPopoverAnchor } =
		useDispatch( 'jetpack/ai-breve' );
	const { tracks } = useAnalytics();

	const isProofreadEnabled = useSelect(
		select => ( select( 'jetpack/ai-breve' ) as BreveSelect ).isProofreadEnabled(),
		[]
	);

	const updateGradeLevel = useCallback( () => {
		if ( ! isProofreadEnabled ) {
			return;
		}

		// Get the text content from all blocks and inner blocks.
		const allText = getPostText( blocks );

		const computedGradeLevel = calculateFleschKincaid( allText );

		const sanitizedGradeLevel =
			typeof computedGradeLevel === 'number' ? computedGradeLevel.toFixed( 2 ) : null;

		setGradeLevel( sanitizedGradeLevel );
	}, [ blocks, isProofreadEnabled ] );

	// Calculating the grade level is expensive, so debounce it to avoid recalculating it on every keypress.
	const debouncedGradeLevelUpdate = useDebounce( updateGradeLevel, 250 );

	const handleToggleFeature = useCallback(
		( feature: string ) => ( checked: boolean ) => {
			tracks.recordEvent( 'jetpack_ai_breve_feature_toggle', { type: feature, on: checked } );
			toggleFeature( feature, checked );
		},
		[ tracks, toggleFeature ]
	);

	const handleAiFeedbackToggle = useCallback( () => {
		tracks.recordEvent( 'jetpack_ai_breve_toggle', { on: ! isProofreadEnabled } );
		toggleProofread();
	}, [ tracks, isProofreadEnabled, toggleProofread ] );

	useEffect( () => {
		debouncedGradeLevelUpdate();
	}, [ debouncedGradeLevelUpdate ] );

	// Update the grade level immediately on first load.
	useInit( updateGradeLevel );

	// Disable the popover when proofread or a feature is disabled.
	useEffect( () => {
		setPopoverHover( false );
		setHighlightHover( false );
		setPopoverAnchor( { target: null, virtual: null } );
	}, [
		setPopoverHover,
		setHighlightHover,
		setPopoverAnchor,
		isProofreadEnabled,
		disabledFeatures,
	] );

	return (
		<div className="jetpack-ai-proofread">
			<p className="jetpack-ai-assistant__help-text">
				{ __( 'Visualize issues and apply AI suggestions.', 'jetpack' ) }
			</p>

			<PanelRow>
				<BaseControl __nextHasNoMarginBottom={ true }>
					<ToggleControl
						checked={ isProofreadEnabled }
						onChange={ handleAiFeedbackToggle }
						label={ __( 'Show issues & suggestions', 'jetpack' ) }
						__nextHasNoMarginBottom={ true }
					/>
				</BaseControl>
			</PanelRow>

			{ isProofreadEnabled && (
				<PanelRow>
					<Card size="small" className="jetpack-ai__write-brief-card">
						<CardBody size="small">
							<BaseControl __nextHasNoMarginBottom={ true }>
								<div className="feature-checkboxes-container">
									{ features.map(
										feature =>
											canWriteBriefFeatureBeEnabled( feature.config.name ) && (
												<CheckboxControl
													className={ isProofreadEnabled ? '' : 'is-disabled' }
													disabled={ ! isProofreadEnabled }
													data-breve-type={ feature.config.name }
													key={ feature.config.name }
													label={ feature.config.title }
													checked={ ! disabledFeatures.includes( feature.config.name ) }
													onChange={ handleToggleFeature( feature.config.name ) }
													__nextHasNoMarginBottom={ true }
												/>
											)
									) }
								</div>
							</BaseControl>
						</CardBody>
						<CardFooter size="small" className="jetpack-ai-proofread__grade-level-container">
							{ gradeLevel === null ? (
								<p className="jetpack-ai-proofread__help-text">
									{ __( 'Write to see your grade level.', 'jetpack' ) }
								</p>
							) : (
								<>
									<div className="jetpack-ai-proofread__grade-label">
										{ gradeLevel } { __( 'Reading grade score', 'jetpack' ) }
									</div>
									<Tooltip text={ __( 'To make it easy to read, aim for level 8–12', 'jetpack' ) }>
										<Icon icon={ help } size={ 20 } />
									</Tooltip>
								</>
							) }
						</CardFooter>
					</Card>
				</PanelRow>
			) }
		</div>
	);
};

export default compose(
	withSelect( selectFn => ( {
		blocks: selectFn( 'core/block-editor' ).getBlocks(),
		disabledFeatures: selectFn( 'jetpack/ai-breve' ).getDisabledFeatures(),
	} ) )
)( Controls );
