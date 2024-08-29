/**
 * External dependencies
 */
import { fixes } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { rawHandler, serialize } from '@wordpress/blocks';
import { Button, Popover, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { reusableBlock as retry } from '@wordpress/icons';
import clsx from 'clsx';
import React from 'react';
/**
 * Internal dependencies
 */
import { AiSVG } from '../../ai-icon';
import { BREVE_FEATURE_NAME } from '../constants';
import features from '../features';
import { LONG_SENTENCES } from '../features/long-sentences';
import {
	SPELLING_MISTAKES,
	addTextToDictionary,
	suggestSpellingFixes,
} from '../features/spelling-mistakes';
import getTargetText from '../utils/get-target-text';
import { numberToOrdinal } from '../utils/number-to-ordinal';
import replaceOccurrence from '../utils/replace-occurrence';
import './style.scss';
/**
 * Types
 */
import type { BreveDispatch, BreveSelect } from '../types';
import type { Block } from '@automattic/jetpack-ai-client';

type CoreBlockEditorSelect = {
	getBlock: ( clientId: string ) => Block;
};

// Setup the Breve highlights
export default function Highlight() {
	const {
		setPopoverHover,
		setSuggestions,
		invalidateSuggestions,
		ignoreSuggestion,
		invalidateSingleSuggestion,
	} = useDispatch( 'jetpack/ai-breve' ) as BreveDispatch;

	const { tracks } = useAnalytics();
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );
	const { getBlock } = useSelect( select => {
		const selector = select( 'core/block-editor' ) as CoreBlockEditorSelect;

		return { getBlock: selector.getBlock };
	}, [] );
	const [ spellingSuggestions, setSpellingSuggestions ] = useState< string[] >( [] );

	const {
		anchor,
		virtual,
		popoverOpen,
		id,
		feature,
		blockId,
		title,
		loading,
		suggestions,
		description,
	} = useSelect( select => {
		const breveSelect = select( 'jetpack/ai-breve' ) as BreveSelect;

		// Popover
		const isPopoverHover = breveSelect.isPopoverHover();
		const isHighlightHover = breveSelect.isHighlightHover();

		// Anchor data
		const defaultAnchor = { target: null, virtual: null };
		const { target: anchorEl, virtual: virtualEl } =
			breveSelect.getPopoverAnchor() ?? defaultAnchor;
		const anchorFeature = anchorEl?.getAttribute?.( 'data-breve-type' ) as string;
		const anchorId = anchorEl?.getAttribute?.( 'data-id' ) as string;
		const anchorBlockId = anchorEl?.getAttribute?.( 'data-block' ) as string;

		// Feature data
		const featureData = features?.find?.( ftr => ftr.config.name === anchorFeature );
		const featureConfig = featureData?.config ?? { name: '', title: '' };
		const featureDescription = featureData?.description ?? '';
		const featureTitle = featureConfig?.title ?? '';

		// Suggestions
		const loadingSuggestions = breveSelect.getSuggestionsLoading( {
			feature: anchorFeature,
			id: anchorId,
			blockId: anchorBlockId,
		} );

		const suggestionsData = breveSelect.getSuggestions( {
			feature: anchorFeature,
			id: anchorId,
			blockId: anchorBlockId,
		} );

		return {
			title: featureTitle,
			description: featureDescription,
			anchor: anchorEl,
			virtual: virtualEl,
			feature: anchorFeature,
			id: anchorId,
			blockId: anchorBlockId,
			popoverOpen: isHighlightHover || isPopoverHover,
			loading: loadingSuggestions,
			suggestions: suggestionsData,
		};
	}, [] );

	const isPopoverOpen = popoverOpen && virtual;
	const hasSuggestions = Boolean( suggestions?.suggestion ) || spellingSuggestions.length > 0;

	const handleMouseEnter = () => {
		setPopoverHover( true );
	};

	const handleMouseLeave = ( e: React.MouseEvent ) => {
		e.stopPropagation();
		setPopoverHover( false );
	};

	const handleSuggestions = () => {
		const block = getBlock( blockId );

		if ( ! block ) {
			setPopoverHover( false );
			return;
		}

		tracks.recordEvent( 'jetpack_ai_breve_ask', {
			feature: BREVE_FEATURE_NAME,
			block: block.name,
			type: feature,
		} );

		const { target, text, occurrence } = getTargetText( anchor as HTMLElement );
		const ordinalOccurence = numberToOrdinal( occurrence );

		setSuggestions( {
			anchor,
			id,
			target,
			feature,
			text,
			blockId,
			occurrence: ordinalOccurence,
		} );
	};

	const handleApplySuggestion = () => {
		const block = getBlock( blockId );

		if ( ! block ) {
			setPopoverHover( false );
			return;
		}

		let render = suggestions?.html;

		// Apply known fixes for table and list-item blocks
		if ( block.name === 'core/table' ) {
			render = fixes.table( suggestions?.html, true, {
				hasFixedLayout: block.attributes?.hasFixedLayout,
			} );
		}

		if ( block.name === 'core/list-item' ) {
			render = fixes.listItem( suggestions?.html, true );
		}

		const [ newBlock ] = rawHandler( { HTML: render } );
		invalidateSuggestions( blockId );
		updateBlockAttributes( blockId, newBlock.attributes );
		setPopoverHover( false );

		tracks.recordEvent( 'jetpack_ai_breve_apply', {
			feature: BREVE_FEATURE_NAME,
			block: block.name,
			type: feature,
		} );
	};

	const handleApplySpellingFix = ( spellingSuggestion: string ) => {
		const block = getBlock( blockId );

		if ( ! block ) {
			setPopoverHover( false );
			return;
		}

		const { target, occurrence } = getTargetText( anchor as HTMLElement );

		// The serialize function returns the block's HTML with its Gutenberg comments
		const html = serialize( block );
		const fixedHtml = replaceOccurrence( {
			text: html,
			target,
			occurrence,
			replacement: spellingSuggestion,
		} );

		const [ newBlock ] = rawHandler( { HTML: fixedHtml } );
		invalidateSuggestions( blockId );
		updateBlockAttributes( blockId, newBlock.attributes );
		setPopoverHover( false );
	};

	const handleRetry = () => {
		invalidateSingleSuggestion( feature, blockId, id );
		handleSuggestions();

		tracks.recordEvent( 'jetpack_ai_breve_retry', {
			feature: BREVE_FEATURE_NAME,
			type: feature,
		} );
	};

	const handleIgnoreSuggestion = () => {
		ignoreSuggestion( blockId, id );
		setPopoverHover( false );

		tracks.recordEvent( 'jetpack_ai_breve_ignore', {
			feature: BREVE_FEATURE_NAME,
			type: feature,
		} );
	};

	const handleAddToDictionary = () => {
		const { target } = getTargetText( anchor as HTMLElement );
		addTextToDictionary( target );

		tracks.recordEvent( 'jetpack_ai_breve_add_to_dictionary', {
			feature: BREVE_FEATURE_NAME,
			type: feature,
			word: target,
			language: 'en',
		} );
	};

	useEffect( () => {
		if ( feature === SPELLING_MISTAKES.name && isPopoverOpen ) {
			// Get the typo
			const typo = anchor?.innerText;

			if ( ! typo ) {
				return;
			}

			// Get the suggestions
			setSpellingSuggestions( suggestSpellingFixes( typo ) );
		} else {
			setSpellingSuggestions( [] );
		}
	}, [ feature, isPopoverOpen, anchor ] );

	return (
		<>
			{ isPopoverOpen && anchor?.parentElement && (
				<Popover
					anchor={ virtual }
					placement={ feature === LONG_SENTENCES.name ? 'bottom' : 'bottom-start' }
					className="jetpack-ai-breve__highlight-popover"
					variant="tooltip"
					animate={ false }
					focusOnMount={ false }
					onMouseEnter={ handleMouseEnter }
					onMouseLeave={ handleMouseLeave }
				>
					<div
						className={ clsx( 'jetpack-ai-breve__highlight-content', {
							'jetpack-ai-breve__has-suggestions': hasSuggestions,
						} ) }
					>
						<div className="jetpack-ai-breve__header-container">
							<div className="jetpack-ai-breve__title">
								<div className="jetpack-ai-breve__color" data-breve-type={ feature } />
								<div>{ title }</div>
							</div>
							{ feature !== SPELLING_MISTAKES.name && (
								<div className="jetpack-ai-breve__action">
									{ hasSuggestions ? (
										<Button
											showTooltip
											size="small"
											iconSize={ 20 }
											icon={ retry }
											label={ __( 'Retry', 'jetpack' ) }
											onClick={ handleRetry }
										/>
									) : (
										<>
											{ loading ? (
												<div className="jetpack-ai-breve__loading">
													<Spinner />
												</div>
											) : (
												<Button
													className="jetpack-ai-breve__suggest"
													icon={ AiSVG }
													iconSize={ 18 }
													onClick={ handleSuggestions }
												>
													{ __( 'Suggest', 'jetpack' ) }
												</Button>
											) }
										</>
									) }
								</div>
							) }
						</div>
						<div className="jetpack-ai-breve__suggestions-container">
							{ feature !== SPELLING_MISTAKES.name && hasSuggestions && (
								<Button variant="tertiary" onClick={ handleApplySuggestion }>
									{ suggestions?.suggestion }
								</Button>
							) }

							{ feature === SPELLING_MISTAKES.name &&
								spellingSuggestions.map( spellingSuggestion => (
									<Button
										variant="tertiary"
										onClick={ () => handleApplySpellingFix( spellingSuggestion ) }
										key={ spellingSuggestion }
										className="jetpack-ai-breve__spelling-suggestion"
									>
										{ spellingSuggestion }
									</Button>
								) ) }
						</div>
						<div className="jetpack-ai-breve__helper">
							{ feature === SPELLING_MISTAKES.name && (
								<Button variant="link" onClick={ handleAddToDictionary }>
									{ __( 'Add to dictionary', 'jetpack' ) }
								</Button>
							) }

							{ feature !== SPELLING_MISTAKES.name &&
								( hasSuggestions
									? __( 'Click on the suggestion to insert it.', 'jetpack' )
									: description ) }

							<div className="jetpack-ai-breve__helper-buttons-wrapper">
								<Button variant="link" onClick={ handleIgnoreSuggestion }>
									{ __( 'Ignore', 'jetpack' ) }
								</Button>
							</div>
						</div>
					</div>
				</Popover>
			) }
		</>
	);
}
