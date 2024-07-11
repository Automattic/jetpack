/**
 * WordPress dependencies
 */
import {
	BaseControl,
	PanelRow,
	SVG,
	Path,
	CheckboxControl,
	ToggleControl,
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
import './breve.scss';
import { getPostText } from './utils/getPostText';

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
			toggleFeature( feature, checked );
		},
		[ toggleFeature ]
	);

	const handleAiFeedbackToggle = useCallback( () => {
		toggleProofread();
	}, [ toggleProofread ] );

	useEffect( () => {
		debouncedGradeLevelUpdate();
	}, [ debouncedGradeLevelUpdate ] );

	// Update the grade level immediately on first load.
	useInit( updateGradeLevel );

	return (
		<div className="jetpack-ai-proofread">
			<PanelRow>
				<BaseControl>
					<div className="grade-level-container">
						{ gradeLevel !== null && gradeLevel <= 12 && (
							<>
								<SVG xmlns="http://www.w3.org/2000/svg" width={ 16 } height={ 15 } fill="none">
									<Path
										fill="#000"
										d="M7.776.454a.25.25 0 0 1 .448 0l2.069 4.192a.25.25 0 0 0 .188.137l4.626.672a.25.25 0 0 1 .139.426l-3.348 3.263a.251.251 0 0 0-.072.222l.79 4.607a.25.25 0 0 1-.362.263l-4.138-2.175a.25.25 0 0 0-.232 0l-4.138 2.175a.25.25 0 0 1-.363-.263l.79-4.607a.25.25 0 0 0-.071-.222L.754 5.881a.25.25 0 0 1 .139-.426l4.626-.672a.25.25 0 0 0 .188-.137L7.776.454Z"
									/>
								</SVG>
								&nbsp;
							</>
						) }
						<p>
							{ gradeLevel === null ? (
								<em className="breve-help-text">Write some words to see your grade&nbsp;level.</em>
							) : (
								<>
									{ gradeLevel }
									<span className="jetpack-ai-proofread__grade-label">
										{ __( 'Readability score', 'jetpack' ) }
									</span>
								</>
							) }
						</p>
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
					{ features.map( feature => (
						<CheckboxControl
							data-type={ feature.config.name }
							key={ feature.config.name }
							label={ feature.config.title }
							checked={ ! disabledFeatures.includes( feature.config.name ) }
							onChange={ handleToggleFeature( feature.config.name ) }
						/>
					) ) }
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
