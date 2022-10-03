import {
	Panel,
	PanelBody,
	RadioControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import useEntityRecordState from 'hooks/use-entity-record-state';
import useSiteLoadingState from 'hooks/use-loading-state';
import useSearchOptions from 'hooks/use-search-options';
import ColorControl from './color-control';
import ExcludedPostTypesControl from './excluded-post-types-control';
import ThemeControl from './theme-control';

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
		resultFormat,
		setColor,
		setExcludedPostTypes,
		setInfiniteScroll,
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
	} = useSearchOptions();

	const { isSaving } = useEntityRecordState();
	const { isLoading } = useSiteLoadingState();
	const isDisabled = isSaving || isLoading;

	// TODO: ask the user if they attempt to navigate away from the page with pending changes.

	return (
		<Panel
			className={ classNames( 'jp-search-configure-sidebar-options', {
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
					options={ [
						{ label: __( 'Relevance (recommended)', 'jetpack-search-pkg' ), value: 'relevance' },
						{ label: __( 'Newest first', 'jetpack-search-pkg' ), value: 'newest' },
						{ label: __( 'Oldest first', 'jetpack-search-pkg' ), value: 'oldest' },
					] }
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
				<ToggleControl
					className="jp-search-configure-show-logo-toggle"
					checked={ showLogo }
					disabled={ isDisabled }
					label={ __( 'Show "Powered by Jetpack"', 'jetpack-search-pkg' ) }
					onChange={ setShowLogo }
				/>
			</PanelBody>
		</Panel>
	);
}
