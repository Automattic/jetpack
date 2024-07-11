/**
 * External dependencies
 */
import { Button, Popover, Spinner } from '@wordpress/components';
import { select as globalSelect, useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { registerFormatType, removeFormat, RichTextValue } from '@wordpress/rich-text';
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

	const { anchor, virtual, popoverOpen, id, feature, identifier, block, title, loading } =
		useSelect( select => {
			const breveSelect = select( 'jetpack/ai-breve' ) as BreveSelect;
			// Popover
			const isPopoverHover = breveSelect.isPopoverHover();
			const isHighlightHover = breveSelect.isHighlightHover();

			// Anchor data
			const { target: anchorEl, virtual: virtualEl } = breveSelect.getPopoverAnchor();
			const anchorFeature = anchorEl?.getAttribute?.( 'data-type' );
			const anchorId = anchorEl?.getAttribute?.( 'data-id' );
			const anchorIdentifier = anchorEl?.getAttribute?.( 'data-identifier' );
			const anchorBlock = anchorEl?.getAttribute?.( 'data-block' );
			const config = features?.find?.( ftr => ftr.config.name === anchorFeature )?.config ?? {
				name: '',
				title: '',
			};

			// Suggestions
			const loadingSuggestions = breveSelect.getSuggestionsLoading( anchorFeature, anchorId );

			return {
				config,
				anchor: anchorEl,
				virtual: virtualEl,
				title: config?.title,
				feature: anchorFeature,
				id: anchorId,
				identifier: anchorIdentifier,
				block: anchorBlock,
				popoverOpen: isHighlightHover || isPopoverHover,
				loading: loadingSuggestions,
			};
		}, [] );

	const isPopoverOpen = popoverOpen && virtual;

	const handleMouseEnter = () => {
		setPopoverHover( true );
	};

	const handleMouseLeave = ( e: React.MouseEvent ) => {
		e.stopPropagation();
		setPopoverHover( false );
	};

	const handleSuggestions = () => {
		const sentence = ( anchor as HTMLElement )?.innerText;
		const content = ( anchor as HTMLElement )?.parentElement?.innerText;

		setSuggestions( {
			id,
			feature,
			identifier,
			sentence,
			content,
			blockClientId: block,
		} );
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
					<div className="highlight-content">
						<div className="title">
							<div className="color" data-type={ feature } />
							<div>{ title }</div>
						</div>
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
