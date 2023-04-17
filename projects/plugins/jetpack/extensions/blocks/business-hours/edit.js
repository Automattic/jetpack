import apiFetch from '@wordpress/api-fetch';
import { Placeholder } from '@wordpress/components';
import { getSettings } from '@wordpress/date';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import DayEdit from './components/day-edit';
import DayPreview from './components/day-preview';
import { icon } from '.';

export const defaultLocalization = {
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
};

class BusinessHours extends Component {
	state = {
		localization: defaultLocalization,
		hasFetched: false,
	};

	componentDidMount() {
		this.apiFetch();
	}

	apiFetch() {
		this.setState( { data: defaultLocalization }, () => {
			apiFetch( { path: '/wpcom/v2/business-hours/localized-week' } ).then(
				data => {
					this.setState( { localization: data, hasFetched: true } );
				},
				() => {
					this.setState( { localization: defaultLocalization, hasFetched: true } );
				}
			);
		} );
	}

	render() {
		const { attributes, className, isSelected } = this.props;
		const { days } = attributes;
		const { localization, hasFetched } = this.state;
		const { startOfWeek } = localization;
		const localizedWeek = days.concat( days.slice( 0, startOfWeek ) ).slice( startOfWeek );

		if ( ! hasFetched ) {
			return <Placeholder icon={ icon } label={ __( 'Loading business hours', 'jetpack' ) } />;
		}

		if ( ! isSelected ) {
			const settings = getSettings();
			const {
				formats: { time },
			} = settings;
			return (
				<dl className={ classNames( className, 'jetpack-business-hours' ) }>
					{ localizedWeek.map( ( day, key ) => {
						return (
							<DayPreview
								key={ key }
								day={ day }
								localization={ localization }
								timeFormat={ time }
							/>
						);
					} ) }
				</dl>
			);
		}

		return (
			<div className={ classNames( className, 'is-edit' ) }>
				{ localizedWeek.map( ( day, key ) => {
					return (
						<DayEdit key={ key } day={ day } localization={ localization } { ...this.props } />
					);
				} ) }
			</div>
		);
	}
}

export default BusinessHours;
