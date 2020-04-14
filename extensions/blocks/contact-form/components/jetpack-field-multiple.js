/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { BaseControl, IconButton } from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import { compose, withInstanceId } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import JetpackFieldLabel from './jetpack-field-label';
import JetpackOption from './jetpack-option';

class JetpackFieldMultiple extends Component {
	constructor( ...args ) {
		super( ...args );
		this.onChangeOption = this.onChangeOption.bind( this );
		this.addNewOption = this.addNewOption.bind( this );
		this.state = { inFocus: null };
	}

	onChangeOption( key = null, option = null ) {
		const newOptions = this.props.options.slice( 0 );
		if ( null === option ) {
			// Remove a key
			newOptions.splice( key, 1 );
			if ( key > 0 ) {
				this.setState( { inFocus: key - 1 } );
			}
		} else {
			// update a key
			newOptions.splice( key, 1, option );
			this.setState( { inFocus: key } ); // set the focus.
		}
		this.props.setAttributes( { options: newOptions } );
	}

	addNewOption( key = null ) {
		const newOptions = this.props.options.slice( 0 );
		let inFocus = 0;
		if ( 'object' === typeof key ) {
			newOptions.push( '' );
			inFocus = newOptions.length - 1;
		} else {
			newOptions.splice( key + 1, 0, '' );
			inFocus = key + 1;
		}

		this.setState( { inFocus: inFocus } );
		this.props.setAttributes( { options: newOptions } );
	}

	render() {
		const {
			type,
			instanceId,
			required,
			label,
			spacing,
			setAttributes,
			isSelected,
			parentBlock,
		} = this.props;
		let { options } = this.props;
		let { inFocus } = this.state;
		if ( ! options.length ) {
			options = [ '' ];
			inFocus = 0;
		}

		if ( parentBlock && parentBlock.attributes.spacing !== spacing ) {
			setAttributes( { spacing: parentBlock.attributes.spacing } );
		}

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
							resetFocus={ () => this.setState( { inFocus: null } ) }
						/>
					}
				>
					<ol
						className="jetpack-field-multiple__list"
						id={ `jetpack-field-multiple-${ instanceId }` }
						style={ {
							marginBottom: spacing + 'px',
						} }
					>
						{ options.map( ( option, index ) => (
							<JetpackOption
								type={ type }
								key={ index }
								option={ option }
								index={ index }
								onChangeOption={ this.onChangeOption }
								onAddOption={ this.addNewOption }
								isInFocus={ index === inFocus && isSelected }
								isSelected={ isSelected }
							/>
						) ) }
					</ol>
					{ isSelected && (
						<IconButton
							className="jetpack-field-multiple__add-option"
							icon="insert"
							label={ __( 'Insert option', 'jetpack' ) }
							onClick={ this.addNewOption }
						>
							{ __( 'Add option', 'jetpack' ) }
						</IconButton>
					) }
				</BaseControl>
			</Fragment>
		);
	}
}

export default compose( [
	withSelect( select => {
		const { getBlock, getSelectedBlockClientId, getBlockHierarchyRootClientId } = select(
			'core/block-editor'
		);
		const selectedBlockClientId = getSelectedBlockClientId();

		return {
			parentBlock: selectedBlockClientId
				? getBlock( getBlockHierarchyRootClientId( selectedBlockClientId ) )
				: null,
		};
	} ),
	withInstanceId,
] )( JetpackFieldMultiple );
