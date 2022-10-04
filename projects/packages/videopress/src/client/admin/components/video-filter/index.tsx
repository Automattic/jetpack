/**
 * External dependencies
 */
import { Button, Col, Container, Text, useBreakpointMatch } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
/**
 * Types
 */
import { MouseEvent } from 'react';
/**
 * Internal dependencies
 */
import filterIcon from '../../../components/icons/filter-icon';
import Checkbox from '../checkbox';
import styles from './style.module.scss';

export const FilterButton = ( props: {
	isActive: boolean;
	onClick?: ( event: MouseEvent< HTMLButtonElement > ) => void;
	disabled?: boolean;
} ): JSX.Element => {
	const { isActive, ...componentProps } = props;
	return (
		<Button
			variant={ isActive ? 'primary' : 'secondary' }
			className={ classnames( styles[ 'filter-button' ], {
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

export const CheckboxCheckmark = ( props: { label?: string; for: string } ): JSX.Element => {
	return (
		<label htmlFor={ props.for } className={ styles[ 'checkbox-container' ] }>
			<Checkbox id={ props.for } className={ styles.checkbox } />
			<span className={ styles[ 'checkbox-checkmark' ] } />
			<Text variant="body-small">{ props.label }</Text>
		</label>
	);
};

export const FilterSection = ( props ): JSX.Element => {
	const [ isSm ] = useBreakpointMatch( 'sm' );

	return (
		<div className={ classnames( styles[ 'filters-section' ], props.className ) }>
			<Container horizontalSpacing={ isSm ? 2 : 4 } horizontalGap={ 2 }>
				<Col sm={ 4 } md={ 4 } lg={ 4 }>
					<Text variant="body-extra-small-bold" weight="bold">
						{ __( 'Uploader', 'jetpack-videopress-pkg' ) }
					</Text>
				</Col>

				<Col sm={ 4 } md={ 4 } lg={ 4 }>
					<Text variant="body-extra-small-bold" weight="bold">
						{ __( 'Privacy', 'jetpack-videopress-pkg' ) }
					</Text>
					<CheckboxCheckmark
						for="filter-public"
						label={ __( 'Public', 'jetpack-videopress-pkg' ) }
					/>
					<CheckboxCheckmark
						for="filter-private"
						label={ __( 'Private', 'jetpack-videopress-pkg' ) }
					/>
				</Col>

				<Col sm={ 4 } md={ 4 } lg={ 4 }>
					<Text variant="body-extra-small-bold" weight="bold">
						{ __( 'Rating', 'jetpack-videopress-pkg' ) }
					</Text>
					<CheckboxCheckmark for="filter-g" label={ __( 'G', 'jetpack-videopress-pkg' ) } />
					<CheckboxCheckmark for="filter-pg-13" label={ __( 'PG-13', 'jetpack-videopress-pkg' ) } />
					<CheckboxCheckmark for="filter-r" label={ __( 'R', 'jetpack-videopress-pkg' ) } />
				</Col>
			</Container>
		</div>
	);
};
