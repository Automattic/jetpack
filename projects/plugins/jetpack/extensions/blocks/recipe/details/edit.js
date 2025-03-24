import { InnerBlocks } from '@wordpress/block-editor';
import { TextControl, __experimentalUnitControl as UnitControl } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import './editor.scss';

const units = [
	{ value: 'm', label: 'min' },
	{ value: 'h', label: 'hours' },
];

function RecipeDetailsEdit( { className, attributes, setAttributes } ) {
	const { prepTime, prepTimeLabel, cookTime, cookTimeLabel, servings, servingsLabel } = attributes;
	return (
		<div className={ className }>
			<div className="wp-container wp-recipe-block-details">
				<div className="group">
					<TextControl
						value={ prepTimeLabel }
						onChange={ val => setAttributes( { prepTimeLabel: val } ) }
						__nextHasNoMarginBottom={ true }
					/>
					<UnitControl
						onChange={ val => setAttributes( { prepTime: val } ) }
						onUnitChange={ val => setAttributes( { prepTimeUnit: val } ) }
						isUnitSelectTabbable
						value={ prepTime }
						units={ units }
						__next40pxDefaultSize={ true }
					/>
				</div>
				<div className="group">
					<TextControl
						value={ cookTimeLabel }
						onChange={ val => setAttributes( { cookTimeLabel: val } ) }
						__nextHasNoMarginBottom={ true }
					/>
					<UnitControl
						onChange={ val => setAttributes( { cookTime: val } ) }
						onUnitChange={ val => {
							setAttributes( { cookTimeUnit: val } );
						} }
						isUnitSelectTabbable
						value={ cookTime }
						units={ units }
						__next40pxDefaultSize={ true }
					/>
				</div>
				<div className="group">
					<TextControl
						value={ servingsLabel }
						onChange={ val => setAttributes( { servingsLabel: val } ) }
						__nextHasNoMarginBottom={ true }
					/>
					<TextControl
						type="number"
						value={ servings }
						onChange={ val => setAttributes( { servings: parseInt( val ) } ) }
						__nextHasNoMarginBottom={ true }
					/>
				</div>
				<div className="group">
					<InnerBlocks
						allowedBlocks={ [ 'jetpack/button' ] }
						template={ [ [ 'jetpack/button', { text: 'Print Recipe' } ] ] }
					/>
				</div>
			</div>
		</div>
	);
}

export default RecipeDetailsEdit;
