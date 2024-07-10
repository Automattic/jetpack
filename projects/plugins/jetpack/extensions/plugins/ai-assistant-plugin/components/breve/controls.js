/**
 * WordPress dependencies
 */
import { BaseControl, PanelRow, SVG, Path } from '@wordpress/components';
import { compose, useDebounce } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
/**
 * External dependencies
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import useAiFeature from '../../../../blocks/ai-assistant/hooks/use-ai-feature';
import config from './dictionaries/dictionaries-config';
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

const Controls = ( { blocks, active } ) => {
	// Allow defaults to be customized, but memoise the result so we're not computing things multiple times.
	const { initialAiOn } = useMemo( () => {
		return applyFilters( 'breve-sidebar-defaults', {
			initialAiOn: true,
		} );
	}, [] );

	// Jetpack AI Assistant feature functions.
	const { requireUpgrade } = useAiFeature();
	const isHighlighting = active;

	// eslint-disable-next-line no-unused-vars
	const [ isAIOn, setIsAIOn ] = useState( initialAiOn );
	const [ gradeLevel, setGradeLevel ] = useState( null );
	// eslint-disable-next-line no-unused-vars
	const [ debouncedContentChangeFlag, setDebouncedContentChangeFlag ] = useState( false );

	const [ toggledKeys, setToggledKeys ] = useState( () => {
		const initialState = {};
		Object.keys( config.dictionaries ).forEach( key => {
			initialState[ key ] = true;
		} );
		return initialState;
	} );

	const updateGradeLevel = useCallback( () => {
		if ( ! isHighlighting ) {
			return;
		}

		// Get the text content from all blocks and inner blocks.
		const allText = getPostText( blocks );

		const computedGradeLevel = calculateFleschKincaid( allText );

		const sanitizedGradeLevel =
			typeof computedGradeLevel === 'number' ? computedGradeLevel.toFixed( 2 ) : null;

		setGradeLevel( sanitizedGradeLevel );

		// Update the content change flag to trigger a re-highlight.
		setDebouncedContentChangeFlag( prev => ! prev );
	}, [ blocks, isHighlighting ] );

	// Calculating the grade level is expensive, so debounce it to avoid recalculating it on every keypress.
	const debouncedGradeLevelUpdate = useDebounce( updateGradeLevel, 250 );

	const handleKeyToggle = key => {
		setToggledKeys( prev => ( {
			...prev,
			[ key ]: ! prev[ key ],
		} ) );
	};

	useEffect( () => {
		if ( requireUpgrade ) {
			setIsAIOn( false );
		} else {
			setIsAIOn( true );
		}
	}, [ requireUpgrade ] );

	useEffect( () => {
		debouncedGradeLevelUpdate();
	}, [ debouncedGradeLevelUpdate ] );

	// Update the grade level immediately on first load.
	useInit( updateGradeLevel );

	return (
		<>
			<PanelRow>
				<BaseControl
					id="breve-sidebar-grade-level"
					label="Reading level"
					help="To make it easy to read, aim for level 8-12. Keep words simple and sentences short."
				>
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
								gradeLevel
							) }
						</p>
					</div>
				</BaseControl>
			</PanelRow>

			<PanelRow>
				<BaseControl id="breve-sidebar-dictionaries" help="">
					{ Object.keys( config.dictionaries ).map( key => (
						<div
							key={ key }
							className={ `key-row ${ toggledKeys[ key ] ? 'enabled' : '' }` }
							onClick={ () => handleKeyToggle( key ) }
							onKeyDown={ event => {
								if ( [ 'Enter', ' ' ].includes( event.key ) ) {
									handleKeyToggle( key );
								}
							} }
							role="button"
							tabIndex={ 0 }
						>
							<div className={ `key ${ key }` }></div>
							<div className="desc">
								<strong>{ config.dictionaries[ key ].label }</strong>
							</div>
						</div>
					) ) }
				</BaseControl>
			</PanelRow>
		</>
	);
};

export default compose(
	withSelect( selectFn => ( {
		blocks: selectFn( 'core/block-editor' ).getBlocks(),
	} ) )
)( Controls );
