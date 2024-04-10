import { Component } from '@wordpress/element';
import { _x, sprintf } from '@wordpress/i18n';
import { isEmpty } from 'lodash';

const defaultLang = 'en';
const lang = ( 'undefined' !== typeof window && window.navigator?.language ) || defaultLang;
const timeFormat = Intl?.DateTimeFormat
	? new Intl.DateTimeFormat( lang, {
			hour: 'numeric',
			minute: 'numeric',
			// Force AM/PM display at the moment since only that format is used in the site
			hour12: true,
	  } )
	: null;
class DayPreview extends Component {
	formatTime( time ) {
		const [ hours, minutes ] = time.split( ':' );
		if ( ! hours || ! minutes ) {
			return false;
		}

		const date = new Date();
		date.setHours( hours );
		date.setMinutes( minutes );

		return timeFormat ? timeFormat.format( date ) : time;
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
