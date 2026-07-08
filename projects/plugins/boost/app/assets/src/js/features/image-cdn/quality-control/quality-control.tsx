import { RangeControl } from '@wordpress/components';
import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { useDebouncedCallback } from 'use-debounce';
import styles from './quality-control.module.scss';
import { useEffect, useId, useState } from 'react';

type QualityControlProps = {
	label: string;
	quality: number;
	lossless: boolean;
	setQuality: ( newValue: number ) => void;
	setLossless: ( newValue: boolean ) => void;
	maxValue: number;
	minValue?: number;
};

/*
 * RangeControl fires onChange on every step, so the quality value is persisted
 * (debounced) once the slider stops moving rather than on every tick.
 */
const SAVE_DEBOUNCE_MS = 200;

const QualityControl = ( {
	label,
	quality,
	lossless,
	setQuality,
	setLossless,
	maxValue,
	minValue = 20,
}: QualityControlProps ) => {
	const checkboxId = useId();
	const [ value, setValue ] = useState( quality );
	useEffect( () => {
		setValue( quality );
	}, [ quality ] );

	const debouncedSetQuality = useDebouncedCallback( ( newValue: number ) => {
		setQuality( newValue );
	}, SAVE_DEBOUNCE_MS );

	return (
		<div className={ styles[ 'quality-control' ] }>
			<div className={ styles.label }>{ label }</div>
			<div className={ clsx( styles.slider, { [ styles.disabled ]: lossless } ) }>
				<RangeControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					value={ value }
					disabled={ lossless }
					min={ minValue }
					max={ maxValue }
					step={ 1 }
					onChange={ newValue => {
						if ( typeof newValue !== 'number' ) {
							return;
						}
						setValue( newValue );
						debouncedSetQuality( newValue );
					} }
				/>
			</div>
			<label className={ styles.lossless } htmlFor={ checkboxId }>
				<input
					type="checkbox"
					checked={ lossless }
					id={ checkboxId }
					onChange={ event => setLossless( event.target.checked ) }
				/>
				{ __( 'Lossless', 'jetpack-boost' ) }
			</label>
		</div>
	);
};

export default QualityControl;
