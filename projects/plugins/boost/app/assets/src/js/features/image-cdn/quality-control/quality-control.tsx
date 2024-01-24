import { NumberSlider } from '@automattic/jetpack-components';
import classNames from 'classnames';
import { __ } from '@wordpress/i18n';
import styles from './quality-control.module.scss';
import { useId } from 'react';
import { QualityConfig } from '../lib/stores';

type QualityControlProps = {
	label: string;
	config: QualityConfig;
	maxValue: number;
	minValue?: number;
	onChange: ( newValue: QualityConfig ) => void;
};

const QualityControl = ( {
	label,
	config,
	maxValue,
	minValue = 20,
	onChange,
}: QualityControlProps ) => {
	const checkboxId = useId();
	return (
		<div className={ styles[ 'quality-control' ] }>
			<div className={ styles.label }>{ label }</div>
			<div className={ classNames( styles.slider, { [ styles.disabled ]: config.lossless } ) }>
				<NumberSlider
					value={ config.quality }
					onChange={ (value) => onChange( { ...config, quality: value } )}
					minValue={ minValue }
					maxValue={ maxValue }
				/>
			</div>
			<label className={ styles.lossless } htmlFor={ checkboxId }>
				<input
					type="checkbox"
					checked={ config.lossless }
					id={ checkboxId }
					onChange={ event => onChange( { ...config, lossless: event.target.checked } ) }
				/>
				{ __( 'Lossless', 'jetpack-boost' ) }
			</label>
		</div>
	);
};

export default QualityControl;
