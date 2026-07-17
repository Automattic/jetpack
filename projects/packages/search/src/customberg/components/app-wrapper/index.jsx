import { __ } from '@wordpress/i18n';
import { Provider } from 'react-redux';
import useSiteLoadingState from 'hooks/use-loading-state';
import useSearchOptions from 'hooks/use-search-options';
import SearchApp from 'instant-search/components/search-app';
import { buildFilterAggregations } from 'instant-search/lib/api';
import { SERVER_OBJECT_NAME } from 'instant-search/lib/constants';
import { getThemeOptions } from 'instant-search/lib/dom';
import store from 'instant-search/store';
import './styles.scss';

// eslint-disable-next-line no-undef
__webpack_public_path__ = window.JetpackInstantSearchOptions.webpackPublicPath;

const PROPS_FROM_WINDOW = {
	aggregations: buildFilterAggregations( [
		...window[ SERVER_OBJECT_NAME ].widgets,
		...window[ SERVER_OBJECT_NAME ].widgetsOutsideOverlay,
	] ),
	defaultSort: window[ SERVER_OBJECT_NAME ].defaultSort,
	hasOverlayWidgets: !! window[ SERVER_OBJECT_NAME ].hasOverlayWidgets,
	options: window[ SERVER_OBJECT_NAME ],
	themeOptions: getThemeOptions( window[ SERVER_OBJECT_NAME ] ),
};

/**
 * Component for wrapping Jetpack Instant Search application.
 *
 * @return {Element} component instance
 */
export default function AppWrapper() {
	const {
		aiAnswersEnabled,
		color,
		excludedPostTypes,
		infiniteScroll,
		filteringOpensOverlay,
		postDate,
		productPrice,
		resultFormat,
		searchSuggestionsEnabled,
		showLogo,
		sort,
		sortEnabled,
		theme,
		trigger,
	} = useSearchOptions();

	const overlayOptions = {
		...window[ SERVER_OBJECT_NAME ].overlayOptions,
		// Override with defined values from Gutenberg preview.
		...Object.fromEntries(
			Object.entries( {
				colorTheme: theme,
				defaultSort: sort,
				enableInfScroll: infiniteScroll,
				enableFilteringOpensOverlay: filteringOpensOverlay,
				enablePostDate: postDate,
				enableProductPrice: productPrice,
				enableSort: sortEnabled,
				excludedPostTypes,
				highlightColor: color,
				overlayTrigger: trigger,
				resultFormat,
				showPoweredBy: showLogo,
			} ).filter( ( [ , v ] ) => typeof v !== 'undefined' )
		),
	};

	// aiAnswersEnabled + searchSuggestionsEnabled live at the top level of the
	// instant-search options object (not under `overlayOptions`). Override them
	// here so the preview reacts to the sidebar toggles without a save round-trip.
	const options = {
		...window[ SERVER_OBJECT_NAME ],
		...Object.fromEntries(
			Object.entries( {
				aiAnswersEnabled,
				searchSuggestionsEnabled,
			} ).filter( ( [ , v ] ) => typeof v !== 'undefined' )
		),
	};

	const { isLoading } = useSiteLoadingState();

	return (
		<div
			/* translators: accessibility text for the widgets screen content landmark region. */
			aria-label={ __( 'Jetpack Search customization preview', 'jetpack-search-pkg' ) }
			className="jp-search-configure-app-wrapper"
			role="region"
			tabIndex="-1"
		>
			{ isLoading ? (
				<img
					className="jp-search-configure-loading-spinner"
					width="32"
					height="32"
					alt={ __( 'Loading', 'jetpack-search-pkg' ) }
					src="//en.wordpress.com/i/loading/loading-64.gif"
				/>
			) : (
				<Provider store={ store }>
					<SearchApp
						{ ...PROPS_FROM_WINDOW }
						enableAnalytics={ false }
						initialIsVisible={ true }
						initialShowResults={ true }
						isInCustomizer={ false }
						options={ options }
						overlayOptions={ overlayOptions }
						shouldCreatePortal={ false }
						shouldIntegrateWithDom={ false }
					/>
				</Provider>
			) }
		</div>
	);
}
