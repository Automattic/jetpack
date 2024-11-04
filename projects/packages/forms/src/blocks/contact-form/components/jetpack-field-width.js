import { BaseControl, Button, ButtonGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function JetpackFieldWidth( { setAttributes, width } ) {
	return (
		<BaseControl
			help={ __(
				'Adjust the width of the field to include multiple fields on a single line.',
				'jetpack-forms'
			) }
			className="jetpack-field-label__width"
			__nextHasNoMarginBottom={ true }
		>
			<BaseControl.VisualLabel>{ __( 'Field Width', 'jetpack-forms' ) }</BaseControl.VisualLabel>
			<ButtonGroup aria-label={ __( 'Field Width', 'jetpack-forms' ) }>
				{ [ 25, 50, 75, 100 ].map( widthValue => {
					return (
						<Button
							key={ widthValue }
							isSmall
							variant={ widthValue === width ? 'primary' : undefined }
							onClick={ () => setAttributes( { width: widthValue } ) }
						>
							{ widthValue }%
						</Button>
					);
				} ) }
			</ButtonGroup>
		</BaseControl>
	);
}
