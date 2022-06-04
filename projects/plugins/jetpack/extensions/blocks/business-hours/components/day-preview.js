import { date } from '@wordpress/date';
import { Component } from '@wordpress/element';
import { _x, sprintf } from '@wordpress/i18n';
import { isEmpty } from 'lodash';

class DayPreview extends Component {
	formatTime( time ) {
		const { timeFormat } = this.props;
		const [ hours, minutes ] = time.split( ':' );
		const _date = new Date();
		if ( ! hours || ! minutes ) {
			return false;
		}
		_date.setHours( hours );
		_date.setMinutes( minutes );
		return date( timeFormat, _date );
	}

	renderInterval = ( interval, key ) => {
		const { day } = this.props;
		const hours = day.hours;
		return (
			<span key={ key }>
				{ sprintf(
					'%1$s - %2$s',
					this.formatTime( interval.opening ),
					this.formatTime( interval.closing )
				) }
				{ hours.length > 1 + key && <span>, </span> }
			</span>
		);
	};

	render() {
		const { day, localization } = this.props;
		const hours = day.hours.filter(
			// remove any malformed or empty intervals
			interval => this.formatTime( interval.opening ) && this.formatTime( interval.closing )
		);
		return (
			<div className="jetpack-business-hours__item">
				<dt className={ day.name }>{ localization.days[ day.name ] }</dt>
				<dd>
					{ isEmpty( hours )
						? _x( 'Closed', 'business is closed on a full day', 'jetpack' )
						: hours.map( this.renderInterval ) }
					<br />
				</dd>
			</div>
		);
	}
}

export default DayPreview;
