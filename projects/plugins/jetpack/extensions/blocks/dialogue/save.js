/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText, getColorClassName } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { BASE_CLASS_NAME } from './utils';
import { convertTimeCodeToSeconds } from '../../shared/components/media-player-control/utils';

export default function save( { attributes, blockName } ) {
	const {
		content,
		label,
		labelTextColor,
		customLabelTextColor,
		labelBackgroundColor,
		customLabelBackgroundColor,
		showTimestamp,
		timestamp,
	} = attributes;
	const labelTextColorCSSClass = getColorClassName( 'color', labelTextColor );
	const labelBackgroundcolorCSSClass = getColorClassName( 'background-color', labelBackgroundColor );

	const speakerCSSClasses = classnames( `${ BASE_CLASS_NAME }__participant`, 'has-bold-style', {
		[ `wp-block-jetpack-${ blockName }` ]: blockName,
		'has-text-color': labelTextColor || customLabelTextColor,
		[ labelTextColorCSSClass ]: labelTextColorCSSClass,
		'has-background-color': labelBackgroundColor || customLabelBackgroundColor,
		[ labelBackgroundcolorCSSClass ]: labelBackgroundcolorCSSClass,
	} );

	const labelInlineStyle = {};
	if ( ! labelTextColorCSSClass ) {
		labelInlineStyle.color = customLabelTextColor;
	}

	if ( ! labelBackgroundcolorCSSClass ) {
		labelInlineStyle.backgroundColor = customLabelBackgroundColor;
	}

	return (
		<div>
			<div className={ `${ BASE_CLASS_NAME }__meta` }>
				<div
					className={ speakerCSSClasses }
					style={ labelInlineStyle }
				>
					{ label }
				</div>
				{ showTimestamp && (
					<div className={ `${ BASE_CLASS_NAME }__timestamp` }>
						<a
							className={ `${ BASE_CLASS_NAME }__timestamp_link` }
							href={ `#${ convertTimeCodeToSeconds( timestamp ) }` }
						>
							{ timestamp }
						</a>
					</div>
				) }
			</div>
			<RichText.Content
				className={ `${ BASE_CLASS_NAME }__content` }
				tagName="p"
				value={ content }
			/>
		</div>
	);
}
