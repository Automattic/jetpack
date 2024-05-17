import { RichText } from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import { isEmpty, isNil, noop, split, trim } from 'lodash';
import { setFocus } from '../util/focus';
import { useFormStyle, useFormWrapper } from '../util/form';
import { withSharedFieldAttributes } from '../util/with-shared-field-attributes';
import JetpackFieldControls from './jetpack-field-controls';
import JetpackFieldLabel from './jetpack-field-label';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

const JetpackDropdown = ( { attributes, clientId, isSelected, name, setAttributes } ) => {
	const { id, label, options, required, requiredText, toggleLabel, width } = attributes;
	const optionsWrapper = useRef();
	const formStyle = useFormStyle( clientId );

	const classes = classnames( 'jetpack-field jetpack-field-dropdown', {
		'is-selected': isSelected,
		'has-placeholder': ! isEmpty( toggleLabel ),
	} );

	useFormWrapper( { attributes, clientId, name } );

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
			setAttributes( { toggleLabel: __( 'Select one option', 'jetpack-forms' ) } );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const { blockStyle } = useJetpackFieldStyles( attributes );

	return (
		<div className={ classes } style={ blockStyle }>
			<div className="jetpack-field-dropdown__wrapper">
				<JetpackFieldLabel
					required={ required }
					requiredText={ requiredText }
					label={ label }
					attributes={ attributes }
					setAttributes={ setAttributes }
					isSelected={ isSelected }
					style={ formStyle }
				/>
				<div className="jetpack-field-dropdown__toggle">
					<RichText
						value={ toggleLabel }
						onChange={ value => {
							setAttributes( { toggleLabel: value } );
						} }
						allowedFormats={ [ 'core/bold', 'core/italic' ] }
						withoutInteractiveFormatting
					/>
					<span className="jetpack-field-dropdown__icon" />
				</div>
			</div>

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
				placeholder={ toggleLabel }
				placeholderField="toggleLabel"
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
