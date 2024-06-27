/**
 * WordPress dependencies
 */
import { getBlockContent } from '@wordpress/blocks';
import {
	BaseControl,
	ToggleControl,
	TextControl,
	PanelRow,
	SVG,
	Path,
} from '@wordpress/components';
import { compose, useDebounce } from '@wordpress/compose';
import { withSelect, subscribe, select } from '@wordpress/data';
import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import config from './dictionaries/dictionaries-config';
import useHighlight from './useHighlight';
import calculateFleschKincaid from './utils/FleschKincaidUtils';
import { handleMessage } from './utils/handleMessage';
import './breve.scss';

export const useInit = init => {
	const [ initialized, setInitialized ] = useState( false );

	if ( ! initialized ) {
		init();
		setInitialized( true );
	}
};

const Controls = ( { blocks } ) => {
	// Allow defaults to be customized, but memoise the result so we're not computing things multiple times.
	const { initialAiOn, initialAiApiKey, ignoreApiKey, initialIsHighlighting } = useMemo( () => {
		return applyFilters( 'breve-sidebar-defaults', {
			initialAiOn: false,
			initialAiApiKey: '',
			initialIsHighlighting: true,
			ignoreApiKey: false,
		} );
	}, [] );

	const [ isHighlighting, setIsHighlighting ] = useState( initialIsHighlighting );
	const [ isAIOn, setIsAIOn ] = useState( initialAiOn );
	const [ AIAPIKey, setAIAPIKey ] = useState( ignoreApiKey ? 'IGNORED' : initialAiApiKey );
	const [ gradeLevel, setGradeLevel ] = useState( null );
	const [ isProcessing, setIsProcessing ] = useState( null );
	const [ toggledKeys, setToggledKeys ] = useState( () => {
		const initialState = {};
		Object.keys( config.dictionaries ).forEach( key => {
			initialState[ key ] = true;
		} );
		return initialState;
	} );

	const updateGradeLevel = useCallback( () => {
		// Get the text content from all blocks and inner blocks.
		const allText = blocks
			.map( block => getBlockContent( block ) )
			.join( '' )
			.replace( /<[^>]*>?/gm, ' ' );

		const computedGradeLevel = calculateFleschKincaid( allText );

		const sanitizedGradeLevel = isNaN( computedGradeLevel )
			? null
			: computedGradeLevel.toFixed( 2 );

		setGradeLevel( sanitizedGradeLevel );
	}, [ blocks ] );

	const updateHandler = event => {
		handleMessage( event );
	};

	const handleToggle = () => {
		setIsHighlighting( ! isHighlighting );
	};

	const handleToggleAI = () => {
		setIsAIOn( ! isAIOn );
	};

	// Calculating the grade level is expensive, so debounce it to avoid recalculating it on every keypress.
	const debouncedGradeLevelUpdate = useDebounce( updateGradeLevel, 250 );

	const handleKeyToggle = key => {
		setToggledKeys( prev => ( {
			...prev,
			[ key ]: ! prev[ key ],
		} ) );
	};

	const fetchApiKey = () => {
		const apiKey = window.localStorage.getItem( 'breve_api_key' );
		if ( apiKey ) {
			setAIAPIKey( apiKey );
		}
	};

	const saveApiKey = apiKey => {
		window.localStorage.setItem( 'breve_api_key', apiKey );
		setAIAPIKey( apiKey );
	};

	useEffect( () => {
		if ( ! ignoreApiKey ) {
			fetchApiKey();
		}
		debouncedGradeLevelUpdate();
	}, [ ignoreApiKey, debouncedGradeLevelUpdate ] );

	// Update the grade level immediately on first load.
	useInit( updateGradeLevel );

	subscribe( () => {
		if ( ! select( 'core/edit-post' ).isPluginSidebarOpened() ) {
			setIsHighlighting( false );
		}
	} );

	useHighlight(
		isHighlighting,
		isAIOn,
		AIAPIKey,
		toggledKeys,
		isProcessing,
		setIsProcessing,
		updateHandler
	);

	return (
		<>
			<PanelRow>
				<BaseControl help="Breve helps you write brief, clear text, to get your message across.">
					<span></span>
				</BaseControl>
			</PanelRow>
			<PanelRow>
				<BaseControl
					id="breve-sidebar-grade-level"
					label="Your Grade level"
					help="The Flesch-Kincaid score shows how readable your text is. Aim for grades 8-12. Use simple words and short sentences."
				>
					<div className="gradeLevelContainer">
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
				<BaseControl id="breve-sidebar-toggle-suggestions" help="">
					<ToggleControl
						label="Show suggestions"
						checked={ isHighlighting }
						onChange={ handleToggle }
					/>
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
								<strong>{ config.dictionaries[ key ].label.split( ':' )[ 0 ] }:</strong>{ ' ' }
								{ config.dictionaries[ key ].label.split( ':' )[ 1 ] }
							</div>
						</div>
					) ) }
				</BaseControl>
			</PanelRow>

			<PanelRow>
				<BaseControl
					id="breve-sidebar-toggle-ai"
					help="Enable to click on highlights and have AI edit the text."
				>
					<ToggleControl label="Edit with AI" checked={ isAIOn } onChange={ handleToggleAI } />
				</BaseControl>
			</PanelRow>
			{ isAIOn && ! ignoreApiKey && (
				<BaseControl id="breve-sidebar-open-ai-api-key" label="OPENAI API KEY">
					<TextControl
						value={ AIAPIKey }
						help="We'll eventually build this in. For now, enter your key to replace text with AI."
						onChange={ value => {
							saveApiKey( value );
						} }
					/>
				</BaseControl>
			) }
		</>
	);
};

export default compose(
	withSelect( selectFn => ( {
		blocks: selectFn( 'core/block-editor' ).getBlocks(),
	} ) )
)( Controls );
