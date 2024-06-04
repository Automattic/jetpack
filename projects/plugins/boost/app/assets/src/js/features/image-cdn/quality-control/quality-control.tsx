import { NumberSlider } from '@automattic/jetpack-components';
import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
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
	return (
		<div className={ styles[ 'quality-control' ] }>
			<div className={ styles.label }>{ label }</div>
			<div className={ clsx( styles.slider, { [ styles.disabled ]: lossless } ) }>
				<NumberSlider
					value={ value }
					onAfterChange={ updatedValue => {
						setValue( updatedValue );
						setQuality( updatedValue );
					} }
					minValue={ minValue }
					maxValue={ maxValue }
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
