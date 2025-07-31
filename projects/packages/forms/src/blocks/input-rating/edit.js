import { useBlockProps } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { DEFAULT_GLYPHS } from './constants';
import Symbols from './symbols';
import './editor.scss';

/**
 * Rating Input Edit Component
 *
 * Interactive rating component that renders clickable symbols (stars, hearts, etc.)
 * and handles user input. Reads values from parent field-rating block via context.
 *
 * @param {object}   props               - Component props from WordPress block editor
 * @param {object}   props.context       - Block context values from parent block
 * @param {Function} props.setAttributes - Function to update block attributes
 * @param {string}   props.clientId      - Unique identifier for the block instance
 * @return {import('react').JSX.Element} Rating input editor component
 */
export default function RatingInputEdit( { context, setAttributes, clientId } ) {
	const max = context?.[ 'jetpack/field-rating-max' ] || 5;
	const defaultValue = context?.[ 'jetpack/field-rating-default' ] || 0;
	const className = context?.[ 'jetpack/field-rating-className' ] || 'is-style-stars';
	const onChangeDefault = context?.[ 'jetpack/field-rating-onChangeDefault' ] || ( () => {} );

	useEffect( () => {
		setAttributes( { className } );
	}, [ className, setAttributes ] );

	// Get icon component based on className
	const icon = className.includes( 'is-style-hearts' )
		? DEFAULT_GLYPHS.hearts.icon
		: DEFAULT_GLYPHS.stars.icon;

	const blockProps = useBlockProps( {
		'aria-label': __( 'Rating input', 'jetpack-forms' ),
		className: 'jetpack-rating-input-wrapper',
		style: {
			// Set the CSS variable that the frontend styles expect
			'--jetpack--contact-form--rating-star-color': 'currentColor',
		},
	} );

	return (
		<div { ...blockProps }>
			<Symbols
				max={ max }
				value={ defaultValue }
				onChange={ onChangeDefault }
				icon={ icon }
				uniqueId={ clientId }
			/>
		</div>
	);
}
