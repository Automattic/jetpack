/**
 * External dependencies
 */
import { Button, Col, Container, Text } from '@automattic/jetpack-components';
import { CheckboxControl } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
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
import styles from './style.module.scss';
import { FilterObject } from './types';
import type { JSX } from 'react';

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

export const CheckboxCheckmark = ( props: {
	label?: string;
	checked?: boolean;
	disabled?: boolean;
	onChange?: ( checked: boolean ) => void;
} ): JSX.Element => {
	return (
		<CheckboxControl
			className={ styles[ 'filter-checkbox' ] }
			label={ props.label }
			checked={ props.checked }
			disabled={ props.disabled }
			onChange={ props.onChange }
		/>
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
	const isSm = useViewportMatch( 'small', '<' );

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
					<Text variant="body-extra-small-bold">
						{ __( 'Uploader', 'jetpack-videopress-pkg' ) }
					</Text>
					{ props.uploaders.map( uploader => (
						<CheckboxCheckmark
							key={ uploader.id }
							label={ uploader.name }
							onChange={ checked =>
								props.onChange?.( VIDEO_FILTER_UPLOADER, uploader.id, checked )
							}
							checked={ filterIsChecked( VIDEO_FILTER_UPLOADER, uploader.id ) }
						/>
					) ) }
				</Col>

				<Col sm={ 4 } md={ 4 } lg={ 4 }>
					<Text variant="body-extra-small-bold">{ __( 'Privacy', 'jetpack-videopress-pkg' ) }</Text>
					<CheckboxCheckmark
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
					<Text variant="body-extra-small-bold">{ __( 'Rating', 'jetpack-videopress-pkg' ) }</Text>
					<CheckboxCheckmark
						label={ __( 'G', 'jetpack-videopress-pkg' ) }
						onChange={ checked => props.onChange?.( VIDEO_FILTER_RATING, VIDEO_RATING_G, checked ) }
						checked={ filterIsChecked( VIDEO_FILTER_RATING, VIDEO_RATING_G ) }
					/>
					<CheckboxCheckmark
						label={ __( 'PG-13', 'jetpack-videopress-pkg' ) }
						onChange={ checked =>
							props.onChange?.( VIDEO_FILTER_RATING, VIDEO_RATING_PG_13, checked )
						}
						checked={ filterIsChecked( VIDEO_FILTER_RATING, VIDEO_RATING_PG_13 ) }
					/>
					<CheckboxCheckmark
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

	const onFilterHandler = ( filterName: string, value: number | string, isActive: boolean ) => {
		// clear the pagination, setting it back to page 1
		searchParams.deleteParam( 'page' );
		searchParams.update();
		setFilter( filterName, value, isActive );
	};

	const { items: users } = useUsers() as { items: Array< { id: number; name: string } > };
	return (
		<FilterSection
			{ ...props }
			onChange={ onFilterHandler }
			uploaders={ users }
			filter={ filter }
		/>
	);
};
