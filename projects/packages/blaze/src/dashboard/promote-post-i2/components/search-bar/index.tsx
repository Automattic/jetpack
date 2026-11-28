import {
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useDebounce, useMediaQuery } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { closeSmall, search as searchIcon } from '@wordpress/icons';
import { Icon, IconButton, InputControl, InputLayout, SelectControl } from '@wordpress/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import config from '../../../compat/config';
import CampaignsFilter, {
	CampaignsFilterType,
	fromControlValue,
	toControlValue,
} from '../campaigns-filter';
import './style.scss';

export type SearchOptions = {
	search?: string;
	filter?: {
		status?: string;
		postType?: string;
	};
	order?: {
		orderBy: string;
		order: string;
	};
};

interface Props {
	mode: 'campaigns' | 'posts';
	handleSetSearch: ( search: SearchOptions ) => void;
	postType?: string;
	handleFilterPostTypeChange?: ( type: string ) => void;
}

export type DropdownOption = {
	label: string;
	value: string;
};

const SORT_OPTIONS_BY_TITLE = 'post_title';
const SORT_OPTIONS_LAST_PUBLISHED = 'date';
const SORT_OPTIONS_RECENTLY_UPDATED = 'modified';
const SORT_OPTIONS_MOST_LIKED = 'like_count';
const SORT_OPTIONS_MOST_COMMENTED = 'comment_count';
const SORT_OPTIONS_MOST_VIEWED = 'monthly_view_count';
const SORT_OPTIONS_IMPRESSIONS_HIGH_LOW = 'impressions_total|desc';
const SORT_OPTIONS_IMPRESSIONS_LOW_HIGH = 'impressions_total|asc';
const SORT_OPTIONS_CLICKS_HIGH_LOW = 'clicks_total|desc';
const SORT_OPTIONS_CLICKS_LOW_HIGH = 'clicks_total|asc';
const SORT_OPTIONS_CREATED_AT = 'created_at';

export const SORT_OPTIONS_DEFAULT = {
	orderBy: SORT_OPTIONS_LAST_PUBLISHED,
	order: 'desc',
};

export const CAMPAIGNS_SORT_OPTIONS_DEFAULT = {
	orderBy: SORT_OPTIONS_CREATED_AT,
	order: 'desc',
};

type FilterSelectProps = {
	label: string;
	className?: string;
	options: DropdownOption[];
	value: string;
	onChange: ( option: DropdownOption ) => void;
};

/**
 * A select with a visually hidden label, for the dashboard filter bars.
 *
 * @param props           - Props.
 * @param props.label     - Accessible label.
 * @param props.className - Wrapper class.
 * @param props.options   - Options to pick from.
 * @param props.value     - Selected option value.
 * @param props.onChange  - Called with the picked option.
 * @return The select.
 */
export function FilterSelect( { label, className, options, value, onChange }: FilterSelectProps ) {
	return (
		<SelectControl
			className={ className }
			label={ label }
			hideLabelFromVision
			items={ options }
			value={ options.find( option => option.value === value ) ?? null }
			itemToStringValue={ item => toControlValue( item.value ?? '' ) }
			onValueChange={ item => {
				if ( item && item.value !== null ) {
					onChange( { label: item.label, value: item.value } );
				}
			} }
		/>
	);
}

const FILTER_OPTIONS_DEFAULT = {
	status: '',
	postType: '',
};

/**
 *
 * @param props
 */
export default function SearchBar( props: Props ) {
	const { mode, handleSetSearch, postType, handleFilterPostTypeChange } = props;
	const isWooStore = config.isEnabled( 'is_running_in_woo_site' );

	const sortOptions: Array< DropdownOption > = [
		{
			label: __( 'By title', 'jetpack-blaze' ),
			value: SORT_OPTIONS_BY_TITLE,
		},
		{
			label: __( 'Last published', 'jetpack-blaze' ),
			value: SORT_OPTIONS_LAST_PUBLISHED,
		},
		{
			label: __( 'Recently updated', 'jetpack-blaze' ),
			value: SORT_OPTIONS_RECENTLY_UPDATED,
		},
		{
			label: __( 'Most liked', 'jetpack-blaze' ),
			value: SORT_OPTIONS_MOST_LIKED,
		},
		{
			label: __( 'Most commented', 'jetpack-blaze' ),
			value: SORT_OPTIONS_MOST_COMMENTED,
		},
		{
			label: __( 'Most viewed', 'jetpack-blaze' ),
			value: SORT_OPTIONS_MOST_VIEWED,
		},
	];

	const campaignSortOptions: Array< DropdownOption > = [
		{
			label: __( 'Recently published', 'jetpack-blaze' ),
			value: SORT_OPTIONS_CREATED_AT,
		},
		{
			label: __( 'Impressions: High - Low', 'jetpack-blaze' ),
			value: SORT_OPTIONS_IMPRESSIONS_HIGH_LOW,
		},
		{
			label: __( 'Impressions: Low - High', 'jetpack-blaze' ),
			value: SORT_OPTIONS_IMPRESSIONS_LOW_HIGH,
		},
		{
			label: __( 'Clicks: High - Low', 'jetpack-blaze' ),
			value: SORT_OPTIONS_CLICKS_HIGH_LOW,
		},
		{
			label: __( 'Clicks: Low - High', 'jetpack-blaze' ),
			value: SORT_OPTIONS_CLICKS_LOW_HIGH,
		},
	];

	const postTypeOptions: Array< DropdownOption > = [
		{
			label: __( 'All', 'jetpack-blaze' ),
			value: '',
		},
		{
			label: __( 'Posts', 'jetpack-blaze' ),
			value: 'post',
		},
		{
			label: __( 'Pages', 'jetpack-blaze' ),
			value: 'page',
		},
		{
			label: __( 'Products', 'jetpack-blaze' ),
			value: 'product',
		},
	];

	const wooPostTypeOptions = [
		{
			value: 'product',
			label: __( 'Products', 'jetpack-blaze' ),
		},
		{
			value: 'post,page',
			label: __( 'Posts & Pages', 'jetpack-blaze' ),
		},
	];

	const campaignFilterOptions: Array< DropdownOption > = [
		{
			value: '',
			label: __( 'All', 'jetpack-blaze' ),
		},
		{
			value: 'active',
			label: __( 'Active', 'jetpack-blaze' ),
		},
		{
			value: 'created',
			label: __( 'In moderation', 'jetpack-blaze' ),
		},
		{
			value: 'finished',
			label: __( 'Completed', 'jetpack-blaze' ),
		},
		{
			value: 'rejected',
			label: __( 'Rejected', 'jetpack-blaze' ),
		},
	];

	const options = isWooStore ? wooPostTypeOptions : postTypeOptions;
	const [ inputValue, setInputValue ] = useState( '' );
	const [ searchInput, setSearchInput ] = useState< string | undefined >( '' );
	const [ sortOption, setSortOption ] = useState( SORT_OPTIONS_DEFAULT );
	const [ campaignSortOption, setCampaignSortOption ] = useState( CAMPAIGNS_SORT_OPTIONS_DEFAULT );
	const [ filterOption, setFilterOption ] = useState( FILTER_OPTIONS_DEFAULT );
	const isDesktop = useMediaQuery( '(min-width: 1300px)' );

	useEffect( () => {
		handleSetSearch( {
			search: '',
			order: mode === 'posts' ? SORT_OPTIONS_DEFAULT : undefined,
			filter:
				mode === 'posts'
					? { ...FILTER_OPTIONS_DEFAULT, postType: postType || '' }
					: FILTER_OPTIONS_DEFAULT,
		} );
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Resets the filters only when the mode changes, as the Calypso original did.
	}, [] );

	const onChangeStatus = ( status: string ) => {
		const newFilter = {
			...filterOption,
			status,
		};

		setFilterOption( newFilter );
		handleSetSearch( {
			search: searchInput || '',
			filter: newFilter,
		} );
	};

	const onChangeSearch = ( search: string ) => {
		setSearchInput( search );
		handleSetSearch( {
			search: search,
			order: mode === 'posts' ? sortOption : campaignSortOption,
			filter: filterOption,
		} );
	};

	const onChangePostTypeFilter = ( option: string ) => {
		const newFilter = {
			...filterOption,
			postType: option,
		};

		if ( handleFilterPostTypeChange ) {
			handleFilterPostTypeChange( option );
		}

		setFilterOption( newFilter );
		handleSetSearch( {
			search: searchInput || '',
			order: sortOption,
			filter: newFilter,
		} );
	};

	const onChangeOrderOption = ( sort: DropdownOption ) => {
		const newOrder = {
			orderBy: sort.value,
			order: sort.value === 'post_title' ? 'asc' : 'desc',
		};

		setSortOption( newOrder );
		handleSetSearch( {
			search: searchInput || '',
			order: newOrder,
			filter: filterOption,
		} );
	};

	const onCampaignChangeOrderOption = ( sort: DropdownOption ) => {
		const [ orderBy, order ] = sort.value.split( '|' );
		const newOrder = {
			orderBy: orderBy,
			order: order === 'asc' ? 'asc' : 'desc',
		};

		setCampaignSortOption( newOrder );
		handleSetSearch( {
			search: searchInput || '',
			order: newOrder,
			filter: filterOption,
		} );
	};

	// A stable callback, since useDebounce cancels the pending call whenever its function changes.
	const onChangeSearchRef = useRef( onChangeSearch );
	useEffect( () => {
		onChangeSearchRef.current = onChangeSearch;
	} );
	const runSearch = useCallback( ( value: string ) => onChangeSearchRef.current( value ), [] );
	const debouncedSearch = useDebounce( runSearch, 500 );

	const campaignSortValue = [ 'clicks_total', 'impressions_total' ].includes(
		campaignSortOption.orderBy
	)
		? `${ campaignSortOption.orderBy }|${ campaignSortOption.order }`
		: campaignSortOption.orderBy;

	const clearSearch = () => {
		debouncedSearch.cancel();
		setInputValue( '' );
		onChangeSearch( '' );
	};

	return (
		<div className="promote-post-i2__search-bar-wrapper">
			<InputControl
				className="promote-post-i2__search-bar-search"
				type="search"
				label={ __( 'Search', 'jetpack-blaze' ) }
				hideLabelFromVision
				placeholder={ __( 'Search…', 'jetpack-blaze' ) }
				autoComplete="off"
				autoCorrect="off"
				spellCheck={ false }
				value={ inputValue }
				onValueChange={ ( value: string ) => {
					setInputValue( value );
					debouncedSearch( value );
				} }
				onKeyDown={ event => {
					if ( event.key === 'Enter' ) {
						debouncedSearch.flush();
					}
				} }
				prefix={
					<InputLayout.Slot>
						<Icon icon={ searchIcon } />
					</InputLayout.Slot>
				}
				suffix={
					inputValue ? (
						<InputLayout.Slot padding="minimal">
							<IconButton
								icon={ closeSmall }
								label={ __( 'Clear search', 'jetpack-blaze' ) }
								variant="minimal"
								size="small"
								onClick={ clearSearch }
							/>
						</InputLayout.Slot>
					) : undefined
				}
			/>

			<div className="promote-post-i2__search-bar-options">
				{ mode === 'posts' && (
					<>
						{ isDesktop ? (
							<ToggleGroupControl
								__next40pxDefaultSize
								hideLabelFromVision
								label={ __( 'Post type', 'jetpack-blaze' ) }
								value={ toControlValue( postType || '' ) }
								onChange={ value => onChangePostTypeFilter( fromControlValue( String( value ) ) ) }
							>
								{ options.map( option => (
									<ToggleGroupControlOption
										key={ option.value }
										value={ toControlValue( option.value ) }
										label={ option.label }
									/>
								) ) }
							</ToggleGroupControl>
						) : (
							<FilterSelect
								className="promote-post-i2__search-bar-dropdown post-type"
								label={ __( 'Post type', 'jetpack-blaze' ) }
								options={ options }
								value={ postType || '' }
								onChange={ option => onChangePostTypeFilter( option.value ) }
							/>
						) }

						<FilterSelect
							className="promote-post-i2__search-bar-dropdown order-by"
							label={ __( 'Sort by', 'jetpack-blaze' ) }
							options={ sortOptions }
							value={ sortOption.orderBy }
							onChange={ onChangeOrderOption }
						/>
					</>
				) }

				{ mode === 'campaigns' && (
					<>
						{ isDesktop && (
							<CampaignsFilter
								handleChangeFilter={ onChangeStatus }
								campaignsFilter={ filterOption.status as CampaignsFilterType }
								options={ campaignFilterOptions }
							/>
						) }

						{ ! isDesktop && (
							<FilterSelect
								className="promote-post-i2__search-bar-dropdown campaigns-filter"
								label={ __( 'Campaign status', 'jetpack-blaze' ) }
								options={ campaignFilterOptions }
								value={ filterOption.status }
								onChange={ option => onChangeStatus( option.value ) }
							/>
						) }

						<FilterSelect
							className="promote-post-i2__search-bar-dropdown campaigns-order-by"
							label={ __( 'Sort by', 'jetpack-blaze' ) }
							options={ campaignSortOptions }
							value={ campaignSortValue }
							onChange={ onCampaignChangeOrderOption }
						/>
					</>
				) }
			</div>
		</div>
	);
}
