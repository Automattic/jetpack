/**
 * External dependencies
 */
import { Button, Col, Container, Text, useBreakpointMatch } from '@automattic/jetpack-components';
import { Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, info } from '@wordpress/icons';
import clsx from 'clsx';
/**
 * Types
 */
import { MouseEvent } from 'react';
/**
 * Internal dependencies
 */
import filterIcon from '../../../components/icons/filter-icon';
import {
	VIDEO_PRIVACY_LEVELS,
	VIDEO_PRIVACY_LEVEL_PRIVATE,
	VIDEO_PRIVACY_LEVEL_PUBLIC,
	VIDEO_RATING_G,
	VIDEO_RATING_PG_13,
	VIDEO_RATING_R_17,
	VIDEO_FILTER_PRIVACY,
	VIDEO_FILTER_RATING,
	VIDEO_FILTER_UPLOADER,
} from '../../../state/constants';
import { useSearchParams } from '../../hooks/use-search-params';
import useUsers from '../../hooks/use-users';
import useVideos from '../../hooks/use-videos';
import Checkbox from '../checkbox';
import styles from './style.module.scss';
import { FilterObject } from './types';

export const FilterButton = ( props: {
	isActive: boolean;
	onClick?: ( event: MouseEvent< HTMLButtonElement > ) => void;
	disabled?: boolean;
} ): JSX.Element => {
	const { isActive, ...componentProps } = props;
	return (
		<Button
			variant={ isActive ? 'primary' : 'secondary' }
			className={ clsx( styles[ 'filter-button' ], {
				[ styles[ 'is-active' ] ]: isActive,
			} ) }
			icon={ filterIcon }
			weight="regular"
			{ ...componentProps }
		>
			{ __( 'Filters', 'jetpack-videopress-pkg' ) }
		</Button>
	);
};

const DisabledReasonTooltip = ( props: { message: string } ): JSX.Element => {
	return (
		<Tooltip position="middle center" text={ props.message }>
			<span className={ styles[ 'title-adornment' ] }>
				<Icon icon={ info } />
			</span>
		</Tooltip>
	);
};

export const CheckboxCheckmark = ( props: {
	label?: string;
	for: string;
	checked?: boolean;
	disabled?: boolean;
	disabledReason?: string;
	onChange?: ( checked: boolean ) => void;
} ): JSX.Element => {
	return (
		<label htmlFor={ props.for } className={ styles[ 'checkbox-container' ] }>
			<Checkbox
				id={ props.for }
				className={ styles.checkbox }
				onChange={ props.onChange }
				checked={ props.checked }
				disabled={ props.disabled }
			/>
			<span className={ styles[ 'checkbox-checkmark' ] } />
			<Text variant="body-small">{ props.label }</Text>
			{ props.disabledReason && <DisabledReasonTooltip message={ props.disabledReason } /> }
		</label>
	);
};

export const FilterSection = ( props: {
	uploaders: Array< { id: number; name: string } >;
	onChange?: (
		filter: 'uploader' | 'privacy' | 'rating',
		value: number | 'PG-13' | 'G' | 'R-17',
		checked: boolean
	) => void;
	className?: string;
	filter?: FilterObject;
} ): JSX.Element => {
	const [ isSm ] = useBreakpointMatch( 'sm' );

	const filterIsChecked = (
		filterName: 'uploader' | 'privacy' | 'rating',
		value: number | string
	) => {
		return props?.filter?.[ filterName ]?.[ value ] === true;
	};

	return (
		<div className={ clsx( styles[ 'filters-section' ], props.className ) }>
			<Container horizontalSpacing={ isSm ? 2 : 4 } horizontalGap={ 2 }>
				<Col sm={ 4 } md={ 4 } lg={ 4 }>
					<Text variant="body-extra-small-bold" weight="bold">
						{ __( 'Uploader', 'jetpack-videopress-pkg' ) }
					</Text>
					{ props.uploaders.map( uploader => (
						<CheckboxCheckmark
							key={ uploader.id }
							label={ uploader.name }
							for={ `uploader-${ uploader.id }` }
							onChange={ checked =>
								props.onChange?.( VIDEO_FILTER_UPLOADER, uploader.id, checked )
							}
							checked={ filterIsChecked( VIDEO_FILTER_UPLOADER, uploader.id ) }
						/>
					) ) }
				</Col>

				<Col sm={ 4 } md={ 4 } lg={ 4 }>
					<Text variant="body-extra-small-bold" weight="bold">
						{ __( 'Privacy', 'jetpack-videopress-pkg' ) }
					</Text>
					<CheckboxCheckmark
						for="filter-public"
						label={ __( 'Public', 'jetpack-videopress-pkg' ) }
						onChange={ checked =>
							props.onChange?.(
								VIDEO_FILTER_PRIVACY,
								VIDEO_PRIVACY_LEVELS.indexOf( VIDEO_PRIVACY_LEVEL_PUBLIC ),
								checked
							)
						}
						checked={ filterIsChecked(
							VIDEO_FILTER_PRIVACY,
							VIDEO_PRIVACY_LEVELS.indexOf( VIDEO_PRIVACY_LEVEL_PUBLIC )
						) }
					/>
					<CheckboxCheckmark
						for="filter-private"
						label={ __( 'Private', 'jetpack-videopress-pkg' ) }
						onChange={ checked =>
							props.onChange?.(
								VIDEO_FILTER_PRIVACY,
								VIDEO_PRIVACY_LEVELS.indexOf( VIDEO_PRIVACY_LEVEL_PRIVATE ),
								checked
							)
						}
						checked={ filterIsChecked(
							VIDEO_FILTER_PRIVACY,
							VIDEO_PRIVACY_LEVELS.indexOf( VIDEO_PRIVACY_LEVEL_PRIVATE )
						) }
					/>
				</Col>

				<Col sm={ 4 } md={ 4 } lg={ 4 }>
					<Text variant="body-extra-small-bold" weight="bold">
						{ __( 'Rating', 'jetpack-videopress-pkg' ) }
					</Text>
					<CheckboxCheckmark
						for="filter-g"
						label={ __( 'G', 'jetpack-videopress-pkg' ) }
						onChange={ checked => props.onChange?.( VIDEO_FILTER_RATING, VIDEO_RATING_G, checked ) }
						checked={ filterIsChecked( VIDEO_FILTER_RATING, VIDEO_RATING_G ) }
					/>
					<CheckboxCheckmark
						for="filter-pg-13"
						label={ __( 'PG-13', 'jetpack-videopress-pkg' ) }
						onChange={ checked =>
							props.onChange?.( VIDEO_FILTER_RATING, VIDEO_RATING_PG_13, checked )
						}
						checked={ filterIsChecked( VIDEO_FILTER_RATING, VIDEO_RATING_PG_13 ) }
					/>
					<CheckboxCheckmark
						for="filter-r"
						label={ __( 'R', 'jetpack-videopress-pkg' ) }
						onChange={ checked =>
							props.onChange?.( VIDEO_FILTER_RATING, VIDEO_RATING_R_17, checked )
						}
						checked={ filterIsChecked( VIDEO_FILTER_RATING, VIDEO_RATING_R_17 ) }
					/>
				</Col>
			</Container>
		</div>
	);
};

export const ConnectFilterSection = props => {
	const { setFilter, filter } = useVideos();
	const searchParams = useSearchParams();

	const onFilterHandler = ( ...filterArgs ) => {
		// clear the pagination, setting it back to page 1
		searchParams.deleteParam( 'page' );
		searchParams.update();
		setFilter( ...filterArgs );
	};

	const { items: users } = useUsers();
	return (
		<FilterSection
			{ ...props }
			onChange={ onFilterHandler }
			uploaders={ users }
			filter={ filter }
		/>
	);
};
