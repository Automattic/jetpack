/**
 * Internal dependencies
 */
import AdControls from './controls';
import { AD_FORMATS } from './constants';

import './editor.scss';

/**
 * Example images
 */
import rectangleExample from './example_300x250.png';
import leaderboardExample from './example_728x90.png';
import mobileLeaderboardExample from './example_320x50.png';
import wideSkyscraperExample from './example_160x600.png';

const WordAdsEdit = ( { attributes, setAttributes } ) => {
	const { format } = attributes;
	const selectedFormatObject = AD_FORMATS.find( ( { tag } ) => tag === format );

	const getExampleAd = formatting => {
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
	};

	return (
		<>
			<AdControls { ...{ attributes, setAttributes } } />
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
			</div>
		</>
	);
};
export default WordAdsEdit;
