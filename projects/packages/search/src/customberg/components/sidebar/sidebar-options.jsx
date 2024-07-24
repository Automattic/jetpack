import {
	Panel,
	PanelBody,
	RadioControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import useEntityRecordState from 'hooks/use-entity-record-state';
import useSiteLoadingState from 'hooks/use-loading-state';
import useSearchOptions from 'hooks/use-search-options';
import { RESULT_FORMAT_PRODUCT, SERVER_OBJECT_NAME } from 'instant-search/lib/constants';
import ColorControl from './color-control';
import ExcludedPostTypesControl from './excluded-post-types-control';
import ThemeControl from './theme-control';

const { isFreePlan = false } = window[ SERVER_OBJECT_NAME ];

/* eslint-disable react/jsx-no-bind */

/**
 * Customization/configuration tab for the sidebar.
 *
 * @returns {Element} component instance
 */
export default function SidebarOptions() {
	// Initializes default values used for FormToggle in order to avoid changing
	// the toggles from uncontrolled (upon mounting) to controlled (after the settings request finishes).
	const {
		color,
		excludedPostTypes,
		infiniteScroll = true,
		filteringOpensOverlay = true,
		resultFormat,
		setColor,
		setExcludedPostTypes,
		setInfiniteScroll,
		setFilteringOpensOverlay,
		setResultFormat,
		setShowLogo,
		setSort,
		setSortEnabled,
		setTheme,
		setTrigger,
		showLogo = true,
		sort,
		sortEnabled = true,
		theme,
		trigger,
		postDate = false,
		setPostDate,
	} = useSearchOptions();

	const { isSaving } = useEntityRecordState();
	const { isLoading } = useSiteLoadingState();
	const isDisabled = isSaving || isLoading;

	const sortOptions = [
		{ label: __( 'Relevance (recommended)', 'jetpack-search-pkg' ), value: 'relevance' },
		{ label: __( 'Newest first', 'jetpack-search-pkg' ), value: 'newest' },
		{ label: __( 'Oldest first', 'jetpack-search-pkg' ), value: 'oldest' },
	];
	if ( resultFormat === RESULT_FORMAT_PRODUCT ) {
		sortOptions.push(
			{ label: __( 'Rating', 'jetpack-search-pkg' ), value: 'rating_desc' },
			{ label: __( 'Price: low to high', 'jetpack-search-pkg' ), value: 'price_asc' },
			{ label: __( 'Price: high to low', 'jetpack-search-pkg' ), value: 'price_desc' }
		);
	}

	// TODO: ask the user if they attempt to navigate away from the page with pending changes.

	return (
		<Panel
			className={ clsx( 'jp-search-configure-sidebar-options', {
				'jp-search-configure-sidebar-options--is-disabled': isDisabled,
			} ) }
		>
			<PanelBody title={ __( 'Styling', 'jetpack-search-pkg' ) } initialOpen={ true }>
				<ThemeControl disabled={ isDisabled } onChange={ setTheme } value={ theme } />
				<RadioControl
					className="jp-search-configure-result-format-radios"
					label={ __( 'Result format', 'jetpack-search-pkg' ) }
					selected={ resultFormat }
					options={ [
						{ label: __( 'Minimal', 'jetpack-search-pkg' ), value: 'minimal' },
						{ label: __( 'Expanded (shows images)', 'jetpack-search-pkg' ), value: 'expanded' },
						{
							label: __( 'Product (for WooCommerce stores)', 'jetpack-search-pkg' ),
							value: 'product',
						},
					] }
					onChange={ setResultFormat }
				/>
				<ColorControl disabled={ isDisabled } onChange={ setColor } value={ color } />
			</PanelBody>

			<PanelBody title={ __( 'Search settings', 'jetpack-search-pkg' ) } initialOpen={ true }>
				<SelectControl
					className="jp-search-configure-default-sort-select"
					disabled={ isDisabled }
					label={ __( 'Default sort', 'jetpack-search-pkg' ) }
					value={ sort }
					options={ sortOptions }
					onChange={ setSort }
				/>
				<SelectControl
					className="jp-search-configure-overlay-trigger-select"
					disabled={ isDisabled }
					label={ __( 'Overlay trigger', 'jetpack-search-pkg' ) }
					value={ trigger }
					options={ [
						{
							label: __( 'Open when user submits the form (recommended)', 'jetpack-search-pkg' ),
							value: 'submit',
						},
						{
							label: __( 'Open when user starts typing', 'jetpack-search-pkg' ),
							value: 'immediate',
						},
					] }
					onChange={ setTrigger }
				/>
				<ToggleControl
					className="jp-search-configure-filtering-opens-overlay-toggle"
					checked={ filteringOpensOverlay }
					disabled={ isDisabled }
					help={ __(
						'Open overlay when filters are used outside the Jetpack Sidebar',
						'jetpack-search-pkg'
					) }
					label={ __( 'Open overlay from filter links', 'jetpack-search-pkg' ) }
					onChange={ setFilteringOpensOverlay }
				/>
				<ExcludedPostTypesControl
					disabled={ isDisabled }
					onChange={ setExcludedPostTypes }
					value={ excludedPostTypes }
				/>
			</PanelBody>

			<PanelBody title={ __( 'Additional settings', 'jetpack-search-pkg' ) } initialOpen={ true }>
				<ToggleControl
					className="jp-search-configure-show-sort-toggle"
					checked={ sortEnabled }
					disabled={ isDisabled }
					label={ __( 'Show sort selector', 'jetpack-search-pkg' ) }
					onChange={ setSortEnabled }
				/>
				<ToggleControl
					className="jp-search-configure-infinite-scroll-toggle"
					checked={ infiniteScroll }
					disabled={ isDisabled }
					label={ __( 'Enable infinite scroll', 'jetpack-search-pkg' ) }
					onChange={ setInfiniteScroll }
				/>
				{ 'expanded' === resultFormat && (
					<ToggleControl
						className="jp-search-configure-post-date-toggle"
						checked={ postDate }
						disabled={ isDisabled }
						label={ __( 'Show post date', 'jetpack-search-pkg' ) }
						onChange={ setPostDate }
					/>
				) }
				{ ! isFreePlan && (
					<ToggleControl
						className="jp-search-configure-show-logo-toggle"
						checked={ showLogo }
						disabled={ isDisabled }
						label={ __( 'Show "Powered by Jetpack"', 'jetpack-search-pkg' ) }
						onChange={ setShowLogo }
					/>
				) }
			</PanelBody>
		</Panel>
	);
}
