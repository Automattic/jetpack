/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Panel,
	PanelBody,
	RadioControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useSiteLoadingState from '../../hooks/use-loading-state';
import useEntityRecordState from '../../hooks/use-entity-record-state';
import useSearchOptions from '../../hooks/use-search-options';
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
	const {
		color,
		excludedPostTypes,
		infiniteScroll,
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
		showLogo,
		sort,
		sortEnabled,
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
			<PanelBody title={ __( 'Styling', 'jetpack' ) } initialOpen={ true }>
				<ThemeControl disabled={ isDisabled } onChange={ setTheme } value={ theme } />
				<RadioControl
					className="jp-search-configure-result-format-radios"
					label={ __( 'Result Format', 'jetpack' ) }
					selected={ resultFormat }
					options={ [
						{ label: __( 'Minimal', 'jetpack' ), value: 'minimal' },
						{ label: __( 'Expanded (shows images)', 'jetpack' ), value: 'expanded' },
						{ label: __( 'Product (for WooCommerce stores)', 'jetpack' ), value: 'product' },
					] }
					onChange={ setResultFormat }
				/>
				<ColorControl disabled={ isDisabled } onChange={ setColor } value={ color } />
			</PanelBody>

			<PanelBody title={ __( 'Search Options', 'jetpack' ) } initialOpen={ true }>
				<SelectControl
					disabled={ isDisabled }
					label={ __( 'Default Sort', 'jetpack' ) }
					value={ sort }
					options={ [
						{ label: __( 'Relevance (recommended)', 'jetpack' ), value: 'relevance' },
						{ label: __( 'Newest first', 'jetpack' ), value: 'newest' },
						{ label: __( 'Oldest first', 'jetpack' ), value: 'oldest' },
					] }
					onChange={ setSort }
				/>
				<SelectControl
					disabled={ isDisabled }
					label={ __( 'Overlay Trigger', 'jetpack' ) }
					value={ trigger }
					options={ [
						{ label: __( 'Open when the user starts typing', 'jetpack' ), value: 'immediate' },
						{ label: __( 'Open when results are available', 'jetpack' ), value: 'results' },
						{ label: __( 'Open when user submits the form', 'jetpack' ), value: 'submit' },
					] }
					onChange={ setTrigger }
				/>
				<ExcludedPostTypesControl
					disabled={ isDisabled }
					onChange={ setExcludedPostTypes }
					value={ excludedPostTypes }
				/>
			</PanelBody>

			<PanelBody title={ __( 'Additional Settings', 'jetpack' ) } initialOpen={ true }>
				<ToggleControl
					checked={ sortEnabled }
					disabled={ isDisabled }
					label={ __( 'Show sort selector', 'jetpack' ) }
					onChange={ setSortEnabled }
				/>
				<ToggleControl
					checked={ infiniteScroll }
					disabled={ isDisabled }
					label={ __( 'Enable Infinite Scroll', 'jetpack' ) }
					onChange={ setInfiniteScroll }
				/>
				<ToggleControl
					checked={ showLogo }
					disabled={ isDisabled }
					label={ __( 'Show "Powered by Jetpack"', 'jetpack' ) }
					onChange={ setShowLogo }
				/>
			</PanelBody>
		</Panel>
	);
}
