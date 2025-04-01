import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './style.scss';

export default function BlogrollAppenderSearch( { value, onChange } ) {
	return (
		<div className="jetpack-blogroll__appender-search">
			<TextControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize={ true }
				label={ __( 'Search for sites to add', 'jetpack' ) }
				hideLabelFromVision
				placeholder={ __( 'Search…', 'jetpack' ) }
				value={ value }
				onChange={ inputValue => onChange( inputValue ) }
			/>
		</div>
	);
}
