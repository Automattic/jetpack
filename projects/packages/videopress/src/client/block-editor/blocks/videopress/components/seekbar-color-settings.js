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
				title={ __( 'Progress Bar Colors', 'jetpack-videopress-pkg' ) }
				initialOpen={ false }
			>
				<ToggleControl
					label={ __( 'Match video', 'jetpack-videopress-pkg' ) }
					help={ __( 'Colors adapt to the video as it plays', 'jetpack-videopress-pkg' ) }
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
							label: __( 'Main', 'jetpack-videopress-pkg' ),
							showTitle,
						},
						{
							value: seekbarLoadingColor,
							onChange: this.handleChangeSeekbarLoadingColor,
							label: __( 'Loaded', 'jetpack-videopress-pkg' ),
							showTitle,
						},
						{
							value: seekbarPlayedColor,
							onChange: this.handleChangeSeekbarPlayedColor,
							label: __( 'Progress', 'jetpack-videopress-pkg' ),
							showTitle,
						},
					] }
				>
					<Button variant="secondary" onClick={ this.saveColors }>
						{ __( 'Save colors', 'jetpack-videopress-pkg' ) }
					</Button>
				</PanelColorSettings>
			</PanelBody>
		);
	}
}

export default SeekbarColorSettings;
