/**
 * External dependencies
 */
import { fixes } from '@automattic/jetpack-ai-client';
import { rawHandler } from '@wordpress/blocks';
import { Button, Popover, Spinner } from '@wordpress/components';
import { select as globalSelect, useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { registerFormatType, removeFormat, RichTextValue } from '@wordpress/rich-text';
import clsx from 'clsx';
import md5 from 'crypto-js/md5';
import React from 'react';
/**
 * Internal dependencies
 */
import { AiSVG } from '../../ai-icon';
import features from '../features';
import registerEvents from '../features/events';
import highlight from './highlight';
import './style.scss';
/**
 * Types
 */
import type { BreveDispatch, BreveSelect } from '../types';
import type { WPFormat } from '@wordpress/rich-text/build-types/register-format-type';
import type { RichTextFormatList } from '@wordpress/rich-text/build-types/types';

// Setup the Breve highlights
export default function Highlight() {
	const { setPopoverHover, setSuggestions } = useDispatch( 'jetpack/ai-breve' ) as BreveDispatch;
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const { anchor, virtual, popoverOpen, id, feature, block, title, loading, suggestions } =
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
			const anchorFeature = anchorEl?.getAttribute?.( 'data-type' );
			const anchorId = anchorEl?.getAttribute?.( 'data-id' );
			const anchorBlock = anchorEl?.getAttribute?.( 'data-block' );
			const config = features?.find?.( ftr => ftr.config.name === anchorFeature )?.config ?? {
				name: '',
				title: '',
			};

			// Suggestions
			const loadingSuggestions = breveSelect.getSuggestionsLoading( anchorFeature, anchorId );
			const suggestionsData = breveSelect.getSuggestions( anchorFeature, anchorId );

			return {
				config,
				anchor: anchorEl,
				virtual: virtualEl,
				title: config?.title,
				feature: anchorFeature,
				id: anchorId,
				block: anchorBlock,
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
		const target = ( anchor as HTMLElement )?.innerText;
		const sentence = ( anchor as HTMLElement )?.parentElement?.innerText;

		setSuggestions( {
			id,
			target,
			feature,
			sentence,
			blockId: block,
		} );
	};

	const handleApplySuggestion = () => {
		// Apply known fixes
		const render = fixes.listItem( suggestions?.html, true ); // Replace li for WP tags

		const [ newBlock ] = rawHandler( { HTML: render } );
		updateBlockAttributes( block, newBlock.attributes );
	};

	return (
		<>
			{ isPopoverOpen && (
				<Popover
					anchor={ virtual }
					placement="bottom"
					className="highlight-popover"
					offset={ 2 }
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
								<button className="suggestion" onClick={ handleApplySuggestion }>
									{ suggestions?.suggestion }
								</button>
								<div className="helper">
									{ __( 'Click on a suggestion to insert it.', 'jetpack' ) }
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

					if ( text && isProofreadEnabled && isFeatureEnabled ) {
						const highlights = featureHighlight( text );

						const applied = highlight( {
							content: record,
							type,
							indexes: highlights,
							attributes: {
								'data-type': config.name,
								'data-id': md5( text ),
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
