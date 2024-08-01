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
} from '@wordpress/components';
import { compose, useDebounce } from '@wordpress/compose';
import { useDispatch, useSelect, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import React, { useState, useEffect, useCallback } from 'react';
/**
 * Internal dependencies
 */
import features from './features';
import calculateFleschKincaid from './utils/FleschKincaidUtils';
import { getPostText } from './utils/getPostText';
import './breve.scss';

export const useInit = init => {
	const [ initialized, setInitialized ] = useState( false );

	if ( ! initialized ) {
		init();
		setInitialized( true );
	}
};

const Controls = ( { blocks, disabledFeatures } ) => {
	const [ gradeLevel, setGradeLevel ] = useState( null );
	const { toggleFeature, toggleProofread } = useDispatch( 'jetpack/ai-breve' );
	const { tracks } = useAnalytics();

	const isProofreadEnabled = useSelect(
		select => select( 'jetpack/ai-breve' ).isProofreadEnabled(),
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
		feature => checked => {
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

	return (
		<div className="jetpack-ai-proofread">
			<p> { __( 'Improve your writing with AI.', 'jetpack' ) }</p>
			<PanelRow>
				<BaseControl>
					<div className="grade-level-container">
						{ gradeLevel === null ? (
							<p>
								<em className="breve-help-text">
									{ __( 'Write to see your grade level.', 'jetpack' ) }
								</em>
							</p>
						) : (
							<Tooltip text={ __( 'To make it easy to read, aim for level 8-12', 'jetpack' ) }>
								<p>
									{ gradeLevel }
									<span className="jetpack-ai-proofread__grade-label">
										{ __( 'Reading grade score', 'jetpack' ) }
									</span>
								</p>
							</Tooltip>
						) }
					</div>
				</BaseControl>
			</PanelRow>

			<PanelRow>
				<BaseControl>
					<ToggleControl
						checked={ isProofreadEnabled }
						onChange={ handleAiFeedbackToggle }
						label={ __( 'Show suggestions', 'jetpack' ) }
					/>
					<div className="feature-checkboxes-container">
						{ features.map( feature => (
							<CheckboxControl
								data-type={ feature.config.name }
								key={ feature.config.name }
								label={ feature.config.title }
								checked={ ! disabledFeatures.includes( feature.config.name ) }
								onChange={ handleToggleFeature( feature.config.name ) }
							/>
						) ) }
					</div>
				</BaseControl>
			</PanelRow>
		</div>
	);
};

export default compose(
	withSelect( selectFn => ( {
		blocks: selectFn( 'core/block-editor' ).getBlocks(),
		disabledFeatures: selectFn( 'jetpack/ai-breve' ).getDisabledFeatures(),
	} ) )
)( Controls );
