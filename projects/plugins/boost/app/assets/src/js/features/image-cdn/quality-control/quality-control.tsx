import { NumberSlider } from '@automattic/jetpack-components';
import classNames from 'classnames';
import { __ } from '@wordpress/i18n';
import styles from './quality-control.module.scss';
import { useId } from 'react';
import { ImageFormat, useImageCdnQuality } from '../lib/stores';

type QualityControlProps = {
	label: string;
	format: ImageFormat;
	maxValue: number;
	minValue?: number;
};

const QualityControl = ( { label, format, maxValue, minValue = 20 }: QualityControlProps ) => {
	const checkboxId = useId();
	const [ config, setConfig ] = useImageCdnQuality( format );

	return (
		<div className={ styles[ 'quality-control' ] }>
			<div className={ styles.label }>{ label }</div>
			<div className={ classNames( styles.slider, { [ styles.disabled ]: config.lossless } ) }>
				<NumberSlider
					value={ config.quality }
					minValue={ minValue }
					maxValue={ maxValue }
					onChange={ newValue => setConfig( { ...config, quality: newValue } ) }
				/>
			</div>
			<label className={ styles.lossless } htmlFor={ checkboxId }>
				<input
					type="checkbox"
					checked={ config.lossless }
					id={ checkboxId }
					onChange={ event => setConfig( { ...config, lossless: event.target.checked } ) }
				/>
				{ __( 'Lossless', 'jetpack-boost' ) }
			</label>
		</div>
	);
};

export default QualityControl;
