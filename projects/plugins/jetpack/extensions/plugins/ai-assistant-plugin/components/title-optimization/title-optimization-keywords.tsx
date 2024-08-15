/**
 * Internal dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './title-optimization-keywords.scss';

type TitleOptimizationKeywordsProps = {
	onGenerate: () => void;
	onKeywordsChange: ( keywords: string ) => void;
	currentKeywords: string;
	disabled: boolean;
};

export default function TitleOptimizationKeywords( {
	onGenerate,
	onKeywordsChange,
	currentKeywords,
	disabled,
}: TitleOptimizationKeywordsProps ) {
	const handleKeywordChange = event => {
		onKeywordsChange( event.target.value );
	};

	return (
		<div className="jetpack-ai-title-optimization__keywords">
			<div className="jetpack-ai-title-optimization__keywords__textarea">
				<textarea
					value={ currentKeywords }
					disabled={ disabled }
					maxLength={ 100 }
					rows={ 1 }
					onChange={ handleKeywordChange }
					placeholder={ __(
						"Add optional keywords you'd like to include and generate new suggestions.",
						'jetpack'
					) }
				></textarea>
			</div>
			<div className="jetpack-ai-title-optimization__keywords__button">
				<Button onClick={ onGenerate } variant="secondary" disabled={ disabled }>
					{ __( 'Generate again', 'jetpack' ) }
				</Button>
			</div>
		</div>
	);
}
