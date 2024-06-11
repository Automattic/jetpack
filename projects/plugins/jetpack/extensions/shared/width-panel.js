import {
	BaseControl,
	Button,
	ButtonGroup,
	PanelBody,
	__experimentalUnitControl as UnitControl, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import './width-panel.scss';

const widthUnits = [
	{ value: '%', label: '%', default: 100 },
	{ value: 'px', label: 'px', default: 150 },
	{ value: 'em', label: 'em', default: 10 },
];

const alignedWidthUnits = [
	{ value: 'px', label: 'px', default: 150 },
	{ value: 'em', label: 'em', default: 10 },
];

const predefinedWidths = [ '25%', '50%', '75%', '100%' ];

export function WidthPanel( props ) {
	return (
		<PanelBody title={ __( 'Width settings', 'jetpack' ) }>
			<WidthControl showLabel={ false } { ...props } />
		</PanelBody>
	);
}

export function WidthControl( { align, width, onChange, showLabel = true } ) {
	const [ unit, setUnit ] = useState( '%' );

	useEffect( () => {
		// If a block has a % width selected and is changed to left or right
		// alignment, it will be floated and the width selection cleared. The
		// unit should also be updated.
		if ( width === undefined ) {
			setUnit( 'px' );
		}
	}, [ width ] );

	// Left and right aligned blocks are floated so % widths don't work as expected.
	const isAlignedLeftOrRight = align === 'left' || align === 'right';

	function handleChange( selectedWidth ) {
		// Check if we are toggling the width off.
		const newWidth = width === selectedWidth ? undefined : selectedWidth;

		// Update the units on the unit control.
		setUnit( '%' );
		onChange( newWidth );
	}

	return (
		<BaseControl label={ showLabel && __( 'Width', 'jetpack' ) }>
			<div
				className={ clsx( 'jetpack-block-width-controls', {
					'is-aligned': isAlignedLeftOrRight,
				} ) }
			>
				{ ! isAlignedLeftOrRight && (
					<ButtonGroup aria-label={ __( 'Percentage Width', 'jetpack' ) }>
						{ predefinedWidths.map( widthValue => {
							return (
								<Button
									key={ widthValue }
									isSmall
									variant={ widthValue === width ? 'primary' : undefined }
									onClick={ () => handleChange( widthValue ) }
								>
									{ widthValue }
								</Button>
							);
						} ) }
					</ButtonGroup>
				) }
				<UnitControl
					isResetValueOnUnitChange
					max={ unit === '%' || width?.includes( '%' ) ? 100 : undefined }
					min={ 0 }
					onChange={ selectedWidth => onChange( selectedWidth ) }
					onUnitChange={ selectedUnit => setUnit( selectedUnit ) }
					size={ 'small' }
					units={ isAlignedLeftOrRight ? alignedWidthUnits : widthUnits }
					value={ width }
				/>
			</div>
		</BaseControl>
	);
}
