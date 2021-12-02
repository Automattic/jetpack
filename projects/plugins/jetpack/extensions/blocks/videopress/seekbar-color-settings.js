/**
 * External dependencies
 */
import React from 'react';
import { Component } from '@wordpress/element';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { __ } from '@wordpress/i18n';

class SeekbarColorSettings extends Component {
	constructor() {
		super( ...arguments );

		const { seekbarColor, seekbarPlayedColor, seekbarLoadingColor } = this.props.attributes;
		this.state = { seekbarColor, seekbarPlayedColor, seekbarLoadingColor };
	}

	handleChangeSeekbarColor = newColor => {
		this.setState( { seekbarColor: newColor } );
	};

	handleChangeSeekbarLoadingColor = newColor => {
		this.setState( { seekbarLoadingColor: newColor } );
	};

	handleChangeSeekbarPlayedColor = newColor => {
		this.setState( { seekbarPlayedColor: newColor } );
	};

	saveColors = () => {
		const { seekbarColor, seekbarLoadingColor, seekbarPlayedColor } = this.state;
		const { setAttributes } = this.props;
		setAttributes( { seekbarColor, seekbarLoadingColor, seekbarPlayedColor } );
	};

	render() {
		const { seekbarColor, seekbarPlayedColor, seekbarLoadingColor } = this.state;

		return (
			<PanelColorSettings
				title={ __( 'Progress Colors', 'jetpack' ) }
				initialOpen={ false }
				colorSettings={ [
					{
						value: seekbarColor,
						onChange: this.handleChangeSeekbarColor,
						label: __( 'Main', 'jetpack' ),
					},
					{
						value: seekbarLoadingColor,
						onChange: this.handleChangeSeekbarLoadingColor,
						label: __( 'Loaded', 'jetpack' ),
					},
					{
						value: seekbarPlayedColor,
						onChange: this.handleChangeSeekbarPlayedColor,
						label: __( 'Progress', 'jetpack' ),
					},
				] }
			>
				<Button isDefault onClick={ this.saveColors }>
					{ __( 'Save colors', 'jetpack' ) }
				</Button>
			</PanelColorSettings>
		);
	}
}

export default SeekbarColorSettings;
