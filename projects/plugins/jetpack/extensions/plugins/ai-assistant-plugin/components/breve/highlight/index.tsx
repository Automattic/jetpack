/**
 * External dependencies
 */
import { fixes } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { rawHandler } from '@wordpress/blocks';
import { Button, Popover, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
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
import { SPELLING_MISTAKES } from '../features/spelling-mistakes';
import { getNodeTextIndex } from '../utils/get-node-text-index';
import { getNonLinkAncestor } from '../utils/get-non-link-ancestor';
import { numberToOrdinal } from '../utils/number-to-ordinal';
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
	const hasSuggestions = Boolean( suggestions?.suggestion );

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

		const target = ( anchor as HTMLElement )?.innerText;
		const parent = getNonLinkAncestor( anchor as HTMLElement );
		// The text containing the target
		const text = parent?.innerText as string;
		// Get the index of the target in the parent
		const startIndex = getNodeTextIndex( parent as HTMLElement, anchor as HTMLElement );
		// Get the occurrences of the target in the sentence
		const targetRegex = new RegExp( target, 'gi' );
		const matches = Array.from( text.matchAll( targetRegex ) ).map( match => match.index );
		// Get the right occurrence of the target in the sentence
		const occurrence = Math.max( 1, matches.indexOf( startIndex ) + 1 );
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

	const handleRetry = () => {
		invalidateSingleSuggestion( feature, blockId, id );
		handleSuggestions();
	};

	const handleIgnoreSuggestion = () => {
		ignoreSuggestion( blockId, id );
		setPopoverHover( false );
		tracks.recordEvent( 'jetpack_ai_breve_ignore', {
			feature: BREVE_FEATURE_NAME,
			type: feature,
		} );
	};

	return (
		<>
			{ isPopoverOpen && (
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
						<div className="jetpack-ai-breve__bottom-container">
							{ hasSuggestions && (
								<Button variant="tertiary" onClick={ handleApplySuggestion }>
									{ suggestions?.suggestion }
								</Button>
							) }
							<div className="jetpack-ai-breve__helper">
								{ hasSuggestions
									? __( 'Click on the suggestion to insert it.', 'jetpack' )
									: description }
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
