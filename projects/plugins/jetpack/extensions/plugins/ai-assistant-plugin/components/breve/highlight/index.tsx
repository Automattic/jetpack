/**
 * External dependencies
 */
import { Button, Popover } from '@wordpress/components';
import { select as globalSelect, useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { registerFormatType, removeFormat, RichTextValue } from '@wordpress/rich-text';
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
	const { setPopoverHover } = useDispatch( 'jetpack/ai-breve' ) as BreveDispatch;

	const popoverOpen = useSelect( select => {
		const store = select( 'jetpack/ai-breve' ) as BreveSelect;
		const isPopoverHover = store.isPopoverHover();
		const isHighlightHover = store.isHighlightHover();
		return isHighlightHover || isPopoverHover;
	}, [] );

	const anchor = useSelect( select => {
		return ( select( 'jetpack/ai-breve' ) as BreveSelect ).getPopoverAnchor();
	}, [] );

	const isPopoverOpen = popoverOpen && anchor;

	const selectedFeatured = anchor ? ( anchor as HTMLElement )?.getAttribute?.( 'data-type' ) : null;

	const featureConfig = features?.find?.( feature => feature.config.name === selectedFeatured )
		?.config ?? {
		name: '',
		title: '',
	};

	const handleMouseEnter = ( e: React.MouseEvent ) => {
		e.stopPropagation();
		setPopoverHover( true );
	};

	const handleMouseLeave = ( e: React.MouseEvent ) => {
		e.stopPropagation();
		setPopoverHover( false );
	};

	return (
		<>
			{ isPopoverOpen && (
				<Popover
					anchor={ anchor }
					placement="bottom"
					offset={ -3 }
					className="highlight-popover"
					variant="tooltip"
					animate={ false }
					focusOnMount={ false }
					onMouseEnter={ handleMouseEnter }
					onMouseLeave={ handleMouseLeave }
				>
					<div className="highlight-content">
						<div className="title">
							<div className="color" data-type={ selectedFeatured } />
							<div>{ featureConfig?.title }</div>
						</div>
						<div className="action">
							<Button icon={ AiSVG }>{ __( 'Suggest', 'jetpack' ) }</Button>
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
				{ blockClientId }
			) {
				return ( formats: Array< RichTextFormatList >, text: string ) => {
					const record = { formats, text } as RichTextValue;
					const type = formatName;

					if ( text && isProofreadEnabled && isFeatureEnabled ) {
						const applied = highlight( {
							content: record,
							type,
							indexes: featureHighlight( record.text ),
							attributes: { 'data-type': config.name },
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
