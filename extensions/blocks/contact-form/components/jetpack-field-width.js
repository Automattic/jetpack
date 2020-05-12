/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { BaseControl, Button, ButtonGroup } from '@wordpress/components';

const JetpackFieldWidth = ( { setAttributes, width } ) => {
	return (
		<BaseControl
			label={ __( 'Field Width', 'jetpack' ) }
			help={ __(
				'Adjust the width of the field to include multiple fields on a single line.',
				'jetpack'
			) }
			className="jetpack-field-label__width"
		>
			<ButtonGroup aria-label={ __( 'Field Width' ) }>
				{ [ 25, 50, 75, 100 ].map( widthValue => {
					return (
						<Button
							key={ widthValue }
							isSmall
							isPrimary={ widthValue === width }
							onClick={ () => setAttributes( { width: widthValue } ) }
						>
							{ widthValue }%
						</Button>
					);
				} ) }
			</ButtonGroup>
		</BaseControl>
	);
};

export default JetpackFieldWidth;
