/**
 * Internal dependencies
 */
import './title-optimization-options.scss';

type TitleOptimizationOptions = {
	value: string;
	label: string;
	description: string;
}[];

const id = 'title-optimization-option';

export default function TitleOptimizationOptions( {
	options,
	selected,
	onChangeValue,
}: {
	options: TitleOptimizationOptions;
	selected: string;
	onChangeValue: ( event: React.ChangeEvent< HTMLInputElement > ) => void;
} ) {
	return (
		<div className="jetpack-ai-title-optimization__options">
			{ options.map( ( option, index ) => (
				<div className="jetpack-ai-title-optimization__option" key={ `${ id }-${ index }` }>
					<input
						id={ `${ id }-${ index }` }
						className="jetpack-ai-title-optimization__option-input"
						type="radio"
						name={ id }
						value={ option.value }
						onChange={ onChangeValue }
						checked={ option.value === selected }
					/>
					<div className="jetpack-ai-title-optimization__option-content">
						<label
							className="jetpack-ai-title-optimization__option-label"
							htmlFor={ `${ id }-${ index }` }
						>
							{ option.label }
						</label>
						<span className="jetpack-ai-title-optimization__option-description">
							{ option.description }
						</span>
					</div>
				</div>
			) ) }
		</div>
	);
}
