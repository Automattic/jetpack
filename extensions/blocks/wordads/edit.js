/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { BlockControls } from '@wordpress/block-editor';
import { Component, Fragment } from '@wordpress/element';
import { ToggleControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import FormatPicker from './format-picker';
import { AD_FORMATS } from './constants';

import './editor.scss';

/**
 * Example images
 */
import rectangleExample from './example_300x250.png';
import leaderboardExample from './example_728x90.png';
import mobileLeaderboardExample from './example_320x50.png';
import wideSkyscraperExample from './example_160x600.png';

class WordAdsEdit extends Component {
	handleHideMobileChange = hideMobile => {
		this.props.setAttributes( { hideMobile: !! hideMobile } );
	};

	render() {
		const { attributes, setAttributes, isSelected } = this.props;
		const { format, hideMobile } = attributes;
		const selectedFormatObject = AD_FORMATS.filter( ( { tag } ) => tag === format )[ 0 ];
		const adControls = (
			<ToggleControl
				className="jetpack-wordads__mobile-visibility"
				checked={ Boolean( hideMobile ) }
				label={ __( 'Hide ad on mobile views', 'jetpack' ) }
				onChange={ this.handleHideMobileChange }
			/>
		);
		function getExampleAd( formatting ) {
			switch ( formatting ) {
				case 'leaderboard':
					return leaderboardExample;
				case 'mobile_leaderboard':
					return mobileLeaderboardExample;
				case `wideskyscraper`:
					return wideSkyscraperExample;
				default:
					return rectangleExample;
			}
		}
		return (
			<Fragment>
				<BlockControls>
					<FormatPicker
						value={ format }
						onChange={ nextFormat => setAttributes( { format: nextFormat } ) }
					/>
				</BlockControls>
				<div className={ `wp-block-jetpack-wordads jetpack-wordads-${ format }` }>
					<div
						className="jetpack-wordads__ad"
						style={ {
							width: selectedFormatObject.width,
							height: selectedFormatObject.height,
							backgroundImage: `url( ${ getExampleAd( format ) } )`,
							backgroundSize: 'cover',
						} }
					></div>
					{ isSelected && adControls }
				</div>
			</Fragment>
		);
	}
}
export default WordAdsEdit;
