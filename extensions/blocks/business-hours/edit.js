/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import classNames from 'classnames';
import { __ } from '@wordpress/i18n';
import { __experimentalGetSettings } from '@wordpress/date';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DayEdit from './components/day-edit';
import DayPreview from './components/day-preview';

const BusinessHoursEdit = props => {
	const { attributes, className, isSelected } = props;
	const { days } = attributes;

	const [ daysOfWeek, setDaysOfWeek ] = useState( {
		days: {
			Sun: __( 'Sunday', 'jetpack' ),
			Mon: __( 'Monday', 'jetpack' ),
			Tue: __( 'Tuesday', 'jetpack' ),
			Wed: __( 'Wednesday', 'jetpack' ),
			Thu: __( 'Thursday', 'jetpack' ),
			Fri: __( 'Friday', 'jetpack' ),
			Sat: __( 'Saturday', 'jetpack' ),
		},
		startOfWeek: 0,
	} );

	const [ hasFetched, setHasFetched ] = useState( false );

	useEffect( () => {
		apiFetch( { path: '/wpcom/v2/business-hours/localized-week' } ).then(
			data => {
				setDaysOfWeek( data );
				setHasFetched( true );
			},
			() => setHasFetched( true )
		);
	}, [ hasFetched ] );

	const localizedWeek = days.concat( days.slice( 0, daysOfWeek ) ).slice( daysOfWeek );
	const {
		formats: { time },
	} = __experimentalGetSettings();

	const daysOutput = localizedWeek.map( ( day, key ) => {
		return <DayEdit key={ key } day={ day } localization={ daysOfWeek } { ...props } />;
	} );

	const classes = classNames( className, ! hasFetched ? 'is-fetching' : undefined, 'is-edit' );

	return (
		<div className={ classes }>
			{ ! isSelected ? (
				<dl className={ classNames( className, 'jetpack-business-hours' ) }>
					{ localizedWeek.map( ( day, key ) => {
						return (
							<DayPreview key={ key } day={ day } localization={ daysOfWeek } timeFormat={ time } />
						);
					} ) }
				</dl>
			) : (
				daysOutput
			) }
		</div>
	);
};

export default BusinessHoursEdit;
