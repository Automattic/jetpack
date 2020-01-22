/**
 * External dependencies
 */
import classNames from 'classnames';
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import JetpackFieldLabel from './jetpack-field-label';

function JetpackFieldAttachment( { isSelected, required, label, setAttributes, id } ) {
	return (
		<Fragment>
			<div className={ classNames( 'jetpack-field-attachment', { 'is-selected': isSelected } ) }>
				<JetpackFieldLabel
					required={ required }
					label={ label }
					setAttributes={ setAttributes }
					isSelected={ isSelected }
				/>
			</div>
			<InspectorControls>
				<PanelBody title={ __( 'Field Settings', 'jetpack' ) }>
					<TextControl
						label={ __( 'ID', 'jetpack' ) }
						value={ id }
						onChange={ value => setAttributes( { id: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
		</Fragment>
	);
}

export default JetpackFieldAttachment;
