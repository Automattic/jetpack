/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import Gridicon from 'gridicons';

import './style.scss';

export default () => (
	<div className="upgrade-nudge" href="/plans?customerType=business">
		<Gridicon className="upgrade-nudge__icon" icon="star" size={ 18 } />
		<div className="upgrade-nudge__info">
			<span className="upgrade-nudge__title">{ __( 'Upgrade to Premium' ) }</span>
			<span className="upgrade-nudge__message">{ __( 'To gain access to this block.' ) }</span>
		</div>
		<button className="upgrade-nudge__button">{ __( 'Upgrade' ) }</button>
	</div>
);
