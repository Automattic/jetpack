import { __ } from '@wordpress/i18n';
import useSiteLoadingState from 'hooks/use-loading-state';
import useSearchOptions from 'hooks/use-search-options';
import SearchApp from 'instant-search/components/search-app';
import { buildFilterAggregations } from 'instant-search/lib/api';
import { SERVER_OBJECT_NAME } from 'instant-search/lib/constants';
import { getThemeOptions } from 'instant-search/lib/dom';
import store from 'instant-search/store';
import { pickBy } from 'lodash';
import { Provider } from 'react-redux';
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
 * @returns {Element} component instance
 */
export default function AppWrapper() {
	const {
		color,
		excludedPostTypes,
		infiniteScroll,
		filteringOpensOverlay,
		postDate,
		resultFormat,
		showLogo,
		sort,
		sortEnabled,
		theme,
		trigger,
	} = useSearchOptions();

	const overlayOptions = {
		...window[ SERVER_OBJECT_NAME ].overlayOptions,
		// Override with defined values from Gutenberg preview.
		...pickBy(
			{
				colorTheme: theme,
				defaultSort: sort,
				enableInfScroll: infiniteScroll,
				enableFilteringOpensOverlay: filteringOpensOverlay,
				enablePostDate: postDate,
				enableSort: sortEnabled,
				excludedPostTypes,
				highlightColor: color,
				overlayTrigger: trigger,
				resultFormat,
				showPoweredBy: showLogo,
			},
			value => typeof value !== 'undefined'
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
						overlayOptions={ overlayOptions }
						shouldCreatePortal={ false }
						shouldIntegrateWithDom={ false }
					/>
				</Provider>
			) }
		</div>
	);
}
