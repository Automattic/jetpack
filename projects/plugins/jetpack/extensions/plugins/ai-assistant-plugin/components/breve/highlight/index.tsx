/**
 * External dependencies
 */
import { fixes } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { rawHandler } from '@wordpress/blocks';
import { getBlockContent } from '@wordpress/blocks';
import { Button, Popover, Spinner } from '@wordpress/components';
import {
	dispatch as globalDispatch,
	select as globalSelect,
	useDispatch,
	useSelect,
} from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { registerFormatType, removeFormat, RichTextValue } from '@wordpress/rich-text';
import clsx from 'clsx';
import md5 from 'crypto-js/md5';
import React from 'react';
/**
 * Internal dependencies
 */
import { AiSVG } from '../../ai-icon';
import { BREVE_FEATURE_NAME } from '../constants';
import features from '../features';
import registerEvents from '../features/events';
import { getNodeTextIndex } from '../utils/get-node-text-index';
import { getNonLinkAncestor } from '../utils/get-non-link-ancestor';
import { numberToOrdinal } from '../utils/number-to-ordinal';
import highlight from './highlight';
import './style.scss';
/**
 * Types
 */
import type { BreveDispatch, BreveSelect } from '../types';
import type { Block } from '@automattic/jetpack-ai-client';
import type { WPFormat } from '@wordpress/rich-text/build-types/register-format-type';
import type { RichTextFormatList } from '@wordpress/rich-text/build-types/types';

type CoreBlockEditorSelect = {
	getBlock: ( clientId: string ) => Block;
};

// Setup the Breve highlights
export default function Highlight() {
	const { setPopoverHover, setSuggestions, invalidateSuggestions } = useDispatch(
		'jetpack/ai-breve'
	) as BreveDispatch;

	const { tracks } = useAnalytics();
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );
	const { getBlock } = useSelect( select => {
		const selector = select( 'core/block-editor' ) as CoreBlockEditorSelect;

		return { getBlock: selector.getBlock };
	}, [] );

	const { anchor, virtual, popoverOpen, id, feature, blockId, title, loading, suggestions } =
		useSelect( select => {
			const breveSelect = select( 'jetpack/ai-breve' ) as BreveSelect;

			// Popover
			const isPopoverHover = breveSelect.isPopoverHover();
			const isHighlightHover = breveSelect.isHighlightHover();

			// Anchor data
			const { target: anchorEl, virtual: virtualEl } = breveSelect.getPopoverAnchor() ?? {
				target: null,
				virtual: null,
			};
			const anchorFeature = anchorEl?.getAttribute?.( 'data-type' ) as string;
			const anchorId = anchorEl?.getAttribute?.( 'data-id' ) as string;
			const anchorBlockId = anchorEl?.getAttribute?.( 'data-block' ) as string;

			const config = features?.find?.( ftr => ftr.config.name === anchorFeature )?.config ?? {
				name: '',
				title: '',
			};

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
				config,
				anchor: anchorEl,
				virtual: virtualEl,
				title: config?.title,
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
		invalidateSuggestions( feature, blockId );
		updateBlockAttributes( blockId, newBlock.attributes );
		setPopoverHover( false );

		tracks.recordEvent( 'jetpack_ai_breve_apply', {
			feature: BREVE_FEATURE_NAME,
			block: block.name,
			type: feature,
		} );
	};

	return (
		<>
			{ isPopoverOpen && (
				<Popover
					anchor={ virtual }
					placement="bottom"
					className="highlight-popover"
					variant="tooltip"
					animate={ false }
					focusOnMount={ false }
					onMouseEnter={ handleMouseEnter }
					onMouseLeave={ handleMouseLeave }
				>
					<div
						className={ clsx( 'highlight-content', {
							'has-suggestions': hasSuggestions,
						} ) }
					>
						<div className="title">
							<div className="color" data-type={ feature } />
							<div>{ title }</div>
						</div>
						{ hasSuggestions ? (
							<div className="suggestion-container">
								<Button variant="tertiary" onClick={ handleApplySuggestion }>
									{ suggestions?.suggestion }
								</Button>
								<div className="helper">
									{ __( 'Click on the suggestion to insert it.', 'jetpack' ) }
								</div>
							</div>
						) : (
							<div className="action">
								{ loading ? (
									<div className="loading">
										<Spinner />
									</div>
								) : (
									<Button icon={ AiSVG } onClick={ handleSuggestions }>
										{ __( 'Suggest', 'jetpack' ) }
									</Button>
								) }
							</div>
						) }
					</div>
				</Popover>
			) }
		</>
	);
}

export function registerBreveHighlights() {
	features.forEach( feature => {
		const { highlight: featureHighlight, config } = feature;
		const { name, ...configSettings } = config;
		const formatName = `jetpack/ai-proofread-${ name }`;

		const settings = {
			name: formatName,
			interactive: false,
			edit: () => {},
			...configSettings,
			__experimentalGetPropsForEditableTreePreparation() {
				return {
					isProofreadEnabled: (
						globalSelect( 'jetpack/ai-breve' ) as BreveSelect
					 ).isProofreadEnabled(),
					isFeatureEnabled: ( globalSelect( 'jetpack/ai-breve' ) as BreveSelect ).isFeatureEnabled(
						config.name
					),
				};
			},
			__experimentalCreatePrepareEditableTree(
				{ isProofreadEnabled, isFeatureEnabled },
				{ blockClientId, richTextIdentifier }
			) {
				return ( formats: Array< RichTextFormatList >, text: string ) => {
					const record = { formats, text } as RichTextValue;
					const type = formatName;

					// Has to be defined here, as adding it to __experimentalGetPropsForEditableTreePreparation
					// causes an issue with the block inserter. ref p1721746774569699-slack-C054LN8RNVA
					const currentMd5 = ( globalSelect( 'jetpack/ai-breve' ) as BreveSelect ).getBlockMd5(
						formatName,
						blockClientId
					);

					if ( text && isProofreadEnabled && isFeatureEnabled ) {
						const block = globalSelect( 'core/block-editor' ).getBlock( blockClientId );
						const blockContent = getBlockContent( block );
						const textMd5 = md5( blockContent ).toString();

						if ( currentMd5 !== textMd5 ) {
							( globalDispatch( 'jetpack/ai-breve' ) as BreveDispatch ).invalidateSuggestions(
								type,
								blockClientId
							);

							( globalDispatch( 'jetpack/ai-breve' ) as BreveDispatch ).setBlockMd5(
								type,
								blockClientId,
								textMd5
							);
						}

						const highlights = featureHighlight( text );
						const applied = highlight( {
							content: record,
							type,
							indexes: highlights,
							attributes: {
								'data-type': config.name,
								'data-identifier': richTextIdentifier ?? 'none',
								'data-block': blockClientId,
							},
						} );

						setTimeout( () => {
							registerEvents( blockClientId );
						}, 100 );

						return applied.formats;
					}

					return removeFormat( record, type, 0, record.text.length ).formats;
				};
			},
		} as WPFormat;

		registerFormatType( formatName, settings );
	} );
}
