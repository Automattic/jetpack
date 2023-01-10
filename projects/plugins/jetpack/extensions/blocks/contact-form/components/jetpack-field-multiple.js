import { Button } from '@wordpress/components';
import { withInstanceId } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import { useFormStyle } from '../util/form';
import JetpackFieldControls from './jetpack-field-controls';
import JetpackFieldLabel from './jetpack-field-label';
import JetpackOption from './jetpack-option';

function JetpackFieldMultiple( props ) {
	const {
		clientId,
		id,
		type,
		instanceId,
		required,
		requiredText,
		label,
		setAttributes,
		isSelected,
		width,
		options,
	} = props;
	const formStyle = useFormStyle( clientId );

	const classes = classnames( 'jetpack-field jetpack-field-multiple', {
		'is-selected': isSelected,
		'has-placeholder': options.length,
	} );

	const [ inFocus, setInFocus ] = useState( null );

	const onChangeOption = ( key = null, option = null ) => {
		const newOptions = options.slice( 0 );

		if ( null === option ) {
			// Remove a key
			newOptions.splice( key, 1 );
			if ( key > 0 ) {
				setInFocus( key - 1 );
			}
		} else {
			// update a key
			newOptions.splice( key, 1, option );
			setInFocus( key ); // set the focus.
		}
		setAttributes( { options: newOptions } );
	};

	const addNewOption = ( key = null ) => {
		const newOptions = options.slice( 0 );
		let newInFocus = 0;

		if ( 'object' === typeof key ) {
			newOptions.push( '' );
			newInFocus = newOptions.length - 1;
		} else {
			newOptions.splice( key + 1, 0, '' );
			newInFocus = key + 1;
		}

		setInFocus( newInFocus );
		setAttributes( { options: newOptions } );
	};

	return (
		<>
			<div id={ `jetpack-field-multiple-${ instanceId }` } className={ classes }>
				<JetpackFieldLabel
					required={ required }
					requiredText={ requiredText }
					label={ label }
					setAttributes={ setAttributes }
					isSelected={ isSelected }
					resetFocus={ () => setInFocus( null ) }
					style={ formStyle }
				/>
				<ol
					className="jetpack-field-multiple__list"
					id={ `jetpack-field-multiple-${ instanceId }` }
				>
					{ options.map( ( option, index ) => (
						<JetpackOption
							type={ type }
							key={ index }
							option={ option }
							index={ index }
							onChangeOption={ onChangeOption }
							onAddOption={ addNewOption }
							isInFocus={ index === inFocus && isSelected }
							isSelected={ isSelected }
						/>
					) ) }
				</ol>
				{ isSelected && (
					<Button
						className="jetpack-field-multiple__add-option"
						icon="insert"
						label={ __( 'Insert option', 'jetpack' ) }
						onClick={ addNewOption }
					>
						{ __( 'Add option', 'jetpack' ) }
					</Button>
				) }
			</div>

			<JetpackFieldControls
				id={ id }
				required={ required }
				setAttributes={ setAttributes }
				width={ width }
			/>
		</>
	);
}

export default withInstanceId( JetpackFieldMultiple );
