import { ThemeProvider } from '@automattic/jetpack-components';
import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import { WordAdsPlaceholder } from './components/jetpack-wordads-placeholder';
import { WordAdsSkeletonLoader } from './components/jetpack-wordads-skeleton-loader';
import { AD_FORMATS } from './constants';
import AdControls from './controls';
import wideSkyscraperExample from './example_160x600.png';
import rectangleExample from './example_300x250.png';
import mobileLeaderboardExample from './example_320x50.png';
import leaderboardExample from './example_728x90.png';

import './editor.scss';

const WordAdsEdit = ( { attributes, setAttributes } ) => {
	const { format } = attributes;
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( 'wordads' );
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

	if ( ! isModuleActive ) {
		if ( isLoadingModules ) {
			return (
				<ThemeProvider>
					<WordAdsSkeletonLoader />
				</ThemeProvider>
			);
		}

		return (
			<WordAdsPlaceholder
				changeStatus={ changeStatus }
				isModuleActive={ isModuleActive }
				isLoading={ isChangingStatus }
			/>
		);
	}

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
