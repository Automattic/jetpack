/**
 * Internal dependencies
 */
import { Button } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './title-optimization-keywords.scss';

type TitleOptimizationKeywordsProps = {
	onGenerate: ( keywords?: string ) => void;
	disabled: boolean;
};

export default function TitleOptimizationKeywords( {
	onGenerate,
	disabled,
}: TitleOptimizationKeywordsProps ) {
	const [ keywords, setKeywords ] = useState( '' );

	const handleKeywordChange = event => {
		setKeywords( event.target.value );
	};

	const handleGenerateClick = useCallback( () => {
		onGenerate( keywords );
	}, [ onGenerate, keywords ] );

	return (
		<div className="jetpack-ai-title-optimization__keywords">
			<div className="jetpack-ai-title-optimization__keywords__textarea">
				<textarea
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
				<Button onClick={ handleGenerateClick } variant="secondary" disabled={ disabled }>
					{ __( 'Generate again', 'jetpack' ) }
				</Button>
			</div>
		</div>
	);
}
