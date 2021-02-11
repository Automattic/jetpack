/**
 * WordPress dependencies
 */
import { Button, ButtonGroup, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function ButtonWidthPanel( { selectedWidth, setAttributes } ) {
	function handleChange( newWidth ) {
		// Check if we are toggling the width off
		const width = selectedWidth === newWidth ? undefined : newWidth;

		// Update attributes
		setAttributes( { width } );
	}

	return (
		<PanelBody title={ __( 'Width settings', 'jetpack' ) }>
			<ButtonGroup aria-label={ __( 'Button width', 'jetpack' ) }>
				{ [ 25, 50, 75, 100 ].map( widthValue => {
					return (
						<Button
							key={ widthValue }
							isSmall
							isPrimary={ widthValue === selectedWidth }
							onClick={ () => handleChange( widthValue ) }
						>
							{ widthValue }%
						</Button>
					);
				} ) }
			</ButtonGroup>
		</PanelBody>
	);
}
