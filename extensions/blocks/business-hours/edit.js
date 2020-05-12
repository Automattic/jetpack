/**
 * External dependencies
 */
import classNames from 'classnames';
import { __ } from '@wordpress/i18n';
import { __experimentalGetSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import DayEdit from './components/day-edit';
import DayPreview from './components/day-preview';
import useLocalizedWeek from './use-localized-week';

const BusinessHoursEdit = props => {
	const { attributes, className, isSelected } = props;
	const { days } = attributes;

	const { hasFetched, localizedWeek, daysOfWeek } = useLocalizedWeek( days );

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
