import { BaseControl, Button } from '@wordpress/components';
import { withInstanceId } from '@wordpress/compose';
import { Fragment, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JetpackFieldControls from './jetpack-field-controls';
import JetpackFieldLabel from './jetpack-field-label';
import JetpackOption from './jetpack-option';

function JetpackFieldMultiple( props ) {
	const {
		id,
		type,
		instanceId,
		required,
		label,
		setAttributes,
		isSelected,
		width,
		options,
	} = props;

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
		<Fragment>
			<BaseControl
				id={ `jetpack-field-multiple-${ instanceId }` }
				className="jetpack-field jetpack-field-multiple"
				label={
					<JetpackFieldLabel
						required={ required }
						label={ label }
						setAttributes={ setAttributes }
						isSelected={ isSelected }
						resetFocus={ () => setInFocus( null ) }
					/>
				}
			>
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
			</BaseControl>

			<JetpackFieldControls
				id={ id }
				required={ required }
				setAttributes={ setAttributes }
				width={ width }
			/>
		</Fragment>
	);
}

export default withInstanceId( JetpackFieldMultiple );
