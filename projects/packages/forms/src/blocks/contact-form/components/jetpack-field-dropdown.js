import { RichText, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { compose } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { isEmpty, noop, split, trim } from 'lodash';
import { getCaretPosition } from '../util/caret';
import { ALLOWED_INNER_BLOCKS } from '../util/constants';
import { setFocus } from '../util/focus';
import { useFormWrapper } from '../util/form';
import { withSharedFieldAttributes } from '../util/with-shared-field-attributes';
import JetpackFieldControls from './jetpack-field-controls';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

const JetpackDropdown = ( { attributes, clientId, isSelected, name, setAttributes } ) => {
	const { id, label, options, required, requiredText, toggleLabel, width } = attributes;
	const optionsWrapper = useRef( undefined );
	const { blockStyle } = useJetpackFieldStyles( attributes );
	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field jetpack-field-dropdown', {
			'is-selected': isSelected,
			'has-placeholder': ! isEmpty( toggleLabel ),
		} ),
		style: blockStyle,
	} );

	useFormWrapper( { attributes, clientId, name } );

	// Does this need to be used for the `is-selected` class above?
	const isInnerBlockSelected = useSelect( select =>
		select( 'core/block-editor' ).hasSelectedInnerBlock( clientId, true )
	);

	const labelBlockType = getBlockType( 'jetpack/field-label' );
	const defaultLabel = labelBlockType.attributes.label.default;
	const template = useMemo( () => {
		return [
			[ 'jetpack/field-label', { label, required, defaultLabel, requiredText } ],
			[ 'jetpack/field-input', { type: 'dropdown' } ],
		];
	}, [ label, defaultLabel, required, requiredText ] );

	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'jetpack-field-dropdown__wrapper' },
		{
			allowedBlocks: ALLOWED_INNER_BLOCKS,
			template,
			templateLock: 'all',
		}
	);

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
		const values = split( value, '\n' ).filter( op => op && trim( op ) !== '' );

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
				<div className="jetpack-field-dropdown__popover" ref={ optionsWrapper }>
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
};

export default compose(
	withSharedFieldAttributes( [
		'borderRadius',
		'borderWidth',
		'labelFontSize',
		'fieldFontSize',
		'lineHeight',
		'labelLineHeight',
		'inputColor',
		'labelColor',
		'fieldBackgroundColor',
		'borderColor',
	] )
)( JetpackDropdown );
