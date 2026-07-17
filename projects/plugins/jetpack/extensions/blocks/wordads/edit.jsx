import { ThemeProvider } from '@automattic/jetpack-components';
import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import { useBlockProps } from '@wordpress/block-editor';
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
	const blockProps = useBlockProps();
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

	let content;

	if ( ! isModuleActive ) {
		if ( isLoadingModules ) {
			content = (
				<ThemeProvider>
					<WordAdsSkeletonLoader />
				</ThemeProvider>
			);
		} else {
			content = (
				<WordAdsPlaceholder
					changeStatus={ changeStatus }
					isModuleActive={ isModuleActive }
					isLoading={ isChangingStatus }
				/>
			);
		}
	} else {
		content = (
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
	}

	return <div { ...blockProps }>{ content }</div>;
};

export default WordAdsEdit;
