/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	BaseControl,
	IconButton,
	PanelBody,
	ToggleControl,
	Toolbar,
	ToolbarButton,
	Path,
} from '@wordpress/components';
import { InspectorControls, BlockControls } from '@wordpress/block-editor';
import { Component, Fragment } from '@wordpress/element';
import { compose, withInstanceId } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import JetpackFieldLabel from './jetpack-field-label';
import JetpackOption from './jetpack-option';
import renderMaterialIcon from '../../../shared/render-material-icon';

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

				<BlockControls>
					<Toolbar>
						<ToolbarButton
							title={ __( 'Required' ) }
							icon={ renderMaterialIcon(
								<Path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z" />
							) }
							onClick={ () => {
								setAttributes( { required: ! required } );
							} }
							className={ required ? 'is-pressed' : undefined }
						/>
					</Toolbar>
				</BlockControls>

				<InspectorControls>
					<PanelBody title={ __( 'Field Settings', 'jetpack' ) }>
						<ToggleControl
							label={ __( 'Field is required', 'jetpack' ) }
							className="jetpack-field-label__required"
							checked={ required }
							onChange={ value => setAttributes( { required: value } ) }
							help={ __(
								'Does this field have to be completed for the form to be submitted?',
								'jetpack'
							) }
						/>
					</PanelBody>
				</InspectorControls>
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
