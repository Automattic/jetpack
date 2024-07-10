/**
 * External dependencies
 */
import { Popover } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { registerFormatType } from '@wordpress/rich-text';
/**
 * Internal dependencies
 */
import features from '../features';
import registerEvents from '../features/events';
import highlight from './highlight';
import './style.scss';

// Setup the Breve highlights
export default function Highlight() {
	const { setPopoverHover } = useDispatch( 'jetpack/ai-breve' );

	const popoverOpen = useSelect( select => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const store = select( 'jetpack/ai-breve' ) as any;
		const isPopoverHover = store.isPopoverHover();
		const isHighlightHover = store.isHighlightHover();
		return isHighlightHover || isPopoverHover;
	}, [] );

	const anchor = useSelect( select => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return ( select( 'jetpack/ai-breve' ) as any ).getPopoverAnchor();
	}, [] );

	const isPopoverOpen = popoverOpen && anchor;

	const handleMouseEnter = () => {
		setPopoverHover( true );
	};

	const handleMouseLeave = () => {
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
					<div>Popover</div>
				</Popover>
			) }
		</>
	);
}

export function registerBreveHighlights() {
	features.forEach( ( { config, highlight: featureHighlight } ) => {
		const { name, ...configSettings } = config;
		const settings = {
			...configSettings,
			__experimentalGetPropsForEditableTreePreparation( _select, { blockClientId } ) {
				return {
					blockClientId,
				};
			},
			__experimentalCreatePrepareEditableTree( { blockClientId } ) {
				return ( formats, text ) => {
					const record = { formats, text };

					const applied = highlight( {
						content: record,
						indexes: featureHighlight( record.text ),
						type: `jetpack/ai-proofread-${ config.name }`,
						attributes: { 'data-type': config.name },
					} );

					setTimeout( () => {
						registerEvents( blockClientId );
					}, 100 );

					return applied.formats;
				};
			},
		} as never;

		registerFormatType( `jetpack/ai-proofread-${ name }`, settings );
	} );
}

export function unregisterBreveHighlights( filter = [] ) {
	const removeFeatures = filter.length
		? features.filter( ( { config } ) => filter.includes( config.name ) )
		: features;

	removeFeatures.forEach( ( { config } ) => {
		const { name } = config;
		registerFormatType( `jetpack/ai-proofread-${ name }`, null );
	} );
}
