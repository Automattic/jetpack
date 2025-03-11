import { BaseControl, ToggleControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
import './style.scss';

export function SeoEnhancer() {
	const [ isEnabled, setIsEnabled ] = useState( true );

	const toggleHandler = () => {
		setIsEnabled( ! isEnabled );
	};

	return (
		<BaseControl __nextHasNoMarginBottom={ true } className="ai-seo-enhancer-toggle">
			<ToggleControl
				checked={ isEnabled }
				onChange={ toggleHandler }
				label={ __( 'Auto-enhance', 'jetpack' ) }
				// __nextHasNoMarginBottom={ true }
				help={ __(
					"Automattically generate SEO title, SEO description and images' alt text.",
					'jetpack'
				) }
			/>
			{ ! isEnabled && (
				<Button
					style={ { width: '100%', justifyContent: 'center' } }
					isBusy={ false }
					disabled={ false }
					onClick={ () => {} }
					variant="secondary"
					__next40pxDefaultSize
				>
					{ __( 'Generate SEO properties', 'jetpack' ) }
				</Button>
			) }
		</BaseControl>
	);
}
