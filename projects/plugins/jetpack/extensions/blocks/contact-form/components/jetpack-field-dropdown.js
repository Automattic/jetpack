import { RichText } from '@wordpress/block-editor';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isEmpty, isNil, noop, split, trim } from 'lodash';
import { setFocus } from '../util/focus';
import { validateFormWrapper } from '../util/form';
import JetpackFieldLabel from './jetpack-field-label';

export const JetpackDropdownEdit = ( {
	attributes,
	clientId,
	isSelected,
	name,
	setAttributes,
} ) => {
	const { label, options, required, requiredText, toggleLabel } = attributes;
	const optionsWrapper = useRef();

	validateFormWrapper( { attributes, clientId, name } );

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

	const handleSplitOption = index => ( value, isOriginal ) => {
		if ( ! isOriginal ) {
			return;
		}

		const splitValue = attributes.options[ index ].slice( value.length );

		if ( isEmpty( value ) && isEmpty( splitValue ) ) {
			return;
		}

		handleMultiValues( index, [ value, splitValue ] );
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

	useEffect( () => {
		if ( isNil( label ) ) {
			setAttributes( { label: '' } );
		}

		if ( isNil( toggleLabel ) ) {
			setAttributes( { toggleLabel: __( 'Select one option', 'jetpack' ) } );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return (
		<>
			<JetpackFieldLabel
				required={ required }
				requiredText={ requiredText }
				label={ label }
				setAttributes={ setAttributes }
				isSelected={ isSelected }
			/>
			<div className="jetpack-field-dropdown">
				<RichText
					value={ toggleLabel }
					className="jetpack-field-dropdown__toggle"
					onChange={ value => {
						setAttributes( { toggleLabel: value } );
					} }
					allowedFormats={ [ 'core/bold', 'core/italic' ] }
					withoutInteractiveFormatting
				/>
				{ isSelected && (
					<div className="jetpack-field-dropdown__popover" ref={ optionsWrapper }>
						{ options.map( ( option, index ) => (
							<RichText
								key={ index }
								value={ option }
								onChange={ handleChangeOption( index ) }
								onSplit={ handleSplitOption( index ) }
								onRemove={ handleDeleteOption( index ) }
								onReplace={ noop }
								placeholder={ __( 'Add option…', 'jetpack' ) }
								__unstableDisableFormats
							/>
						) ) }
					</div>
				) }
			</div>
		</>
	);
};
