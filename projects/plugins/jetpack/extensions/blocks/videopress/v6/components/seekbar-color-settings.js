import { PanelColorSettings } from '@wordpress/block-editor';
import { Button, PanelBody, ToggleControl } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';

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
		const { toggleAttribute, useAverageColor } = this.props;
		const showTitle = true;

		return (
			<PanelBody
				className="seekbar-color-settings__panel"
				title={ __( 'Progress Bar Colors', 'jetpack' ) }
				initialOpen={ false }
			>
				<ToggleControl
					label={ __( 'Match video', 'jetpack' ) }
					help={ __( 'Colors adapt to the video as it plays', 'jetpack' ) }
					onChange={ toggleAttribute( 'useAverageColor' ) }
					checked={ useAverageColor }
				/>
				<PanelColorSettings
					opened={ ! useAverageColor }
					showTitle={ false }
					colorSettings={ [
						{
							value: seekbarColor,
							onChange: this.handleChangeSeekbarColor,
							label: __( 'Main', 'jetpack' ),
							showTitle,
						},
						{
							value: seekbarLoadingColor,
							onChange: this.handleChangeSeekbarLoadingColor,
							label: __( 'Loaded', 'jetpack' ),
							showTitle,
						},
						{
							value: seekbarPlayedColor,
							onChange: this.handleChangeSeekbarPlayedColor,
							label: __( 'Progress', 'jetpack' ),
							showTitle,
						},
					] }
				>
					<Button variant="secondary" onClick={ this.saveColors }>
						{ __( 'Save colors', 'jetpack' ) }
					</Button>
				</PanelColorSettings>
			</PanelBody>
		);
	}
}

export default SeekbarColorSettings;
