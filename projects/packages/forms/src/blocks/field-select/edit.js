import {
	RichText,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
import { getCaretPosition } from '../shared/util/caret';
import { ALLOWED_INNER_BLOCKS } from '../shared/util/constants';
import setFocus from '../shared/util/set-focus';

const noop = () => undefined;

export default function DropdownFieldEdit( props ) {
	const { attributes, clientId, isSelected, name, setAttributes } = props;
	const { id, options, required, width } = attributes;
	const { blockStyle } = useJetpackFieldStyles( attributes );
	const { isInnerBlockSelected, inputBlockAttributes } = useSelect(
		select => {
			const { getBlock, hasSelectedInnerBlock } = select( blockEditorStore );
			return {
				isInnerBlockSelected: hasSelectedInnerBlock( clientId, true ),
				inputBlockAttributes: getBlock( clientId ).innerBlocks[ 1 ]?.attributes,
			};
		},
		[ clientId ]
	);

	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field jetpack-field-dropdown', {
			'is-selected': isSelected || isInnerBlockSelected,
			'has-placeholder': !! inputBlockAttributes?.placeholder,
		} ),
		style: blockStyle,
	} );

	const optionsWrapper = useRef( undefined );
	useFormWrapper( { attributes, clientId, name } );

	const template = useMemo( () => {
		return [
			[ 'jetpack/label', { required } ],
			[
				'jetpack/input',
				{ type: 'dropdown', placeholder: __( 'Select one option', 'jetpack-forms' ) },
			],
		];
	}, [ required ] );

	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'jetpack-field-dropdown__wrapper' },
		{
			allowedBlocks: ALLOWED_INNER_BLOCKS,
			template,
			templateLock: 'all',
		}
	);

	const optionWrapperStyles = {
		className: 'jetpack-field-dropdown__popover',
	};

	const changeFocus = ( index, cursorToEnd ) =>
		setFocus( optionsWrapper.current, '[role=textbox]', index, cursorToEnd );

	const handleSingleValue = ( index, value ) => {
		const _options = [ ...options ];

		_options[ index ] = value;

		setAttributes( { options: _options } );
		changeFocus( index );
	};

	const handleMultiValues = ( index, array ) => {
		const _options = [ ...attributes.options ];
		const cursorToEnd = array[ array.length - 1 ] !== '';

		if ( _options[ index ] ) {
			_options[ index ] = array.shift();
			index++;
		}

		_options.splice( index, 0, ...array );

		setAttributes( { options: _options } );
		changeFocus( index + array.length - 1, cursorToEnd );
	};

	const handleChangeOption = index => value => {
		const values = ( value || '' ).split( '\n' ).filter( op => op && op.trim() !== '' );

		if ( ! values.length ) {
			return;
		}

		if ( values.length > 1 ) {
			handleMultiValues( index, values );
		} else {
			handleSingleValue( index, values.pop() );
		}
	};

	const handleKeyDown = index => e => {
		// Create a new dropdown option when the user hits Enter.
		// Previously handled with the onSplit prop, which was removed in https://github.com/WordPress/gutenberg/pull/54543
		if ( 'Enter' !== e.key ) {
			return;
		}

		e.preventDefault();

		const value = attributes.options[ index ];

		if ( ! value ) {
			return;
		}

		const caretPos = getCaretPosition( e.target );
		// splitValue is the value after the caret position when a user hits Enter
		const splitValue = caretPos ? value.slice( caretPos ) : '';

		handleMultiValues(
			index,
			splitValue ? [ value.slice( 0, caretPos ), splitValue ] : [ value, '' ]
		);
	};

	const handleDeleteOption = index => () => {
		if ( attributes.options.length === 1 ) {
			return;
		}

		const _options = [ ...attributes.options ];
		_options.splice( index, 1 );
		setAttributes( { options: _options } );
		changeFocus( Math.max( index - 1, 0 ), true );
	};

	return (
		<div { ...blockProps }>
			<div { ...innerBlocksProps } />
			{ ( isSelected || isInnerBlockSelected ) && (
				<div ref={ optionsWrapper } { ...optionWrapperStyles }>
					{ options.map( ( option, index ) => (
						<RichText
							key={ index }
							value={ option }
							onChange={ handleChangeOption( index ) }
							onKeyDown={ handleKeyDown( index ) }
							onRemove={ handleDeleteOption( index ) }
							onReplace={ noop }
							placeholder={ __( 'Add option…', 'jetpack-forms' ) }
							__unstableDisableFormats
						/>
					) ) }
				</div>
			) }
			<JetpackFieldControls
				id={ id }
				required={ required }
				attributes={ attributes }
				setAttributes={ setAttributes }
				width={ width }
				type="dropdown"
			/>
		</div>
	);
}
