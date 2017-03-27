/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import noop from 'lodash/noop';
import Banner from 'components/banner';

/**
 * Internal dependencies
 */
import { arePromotionsActive } from 'state/initial-state';

class JetpackBanner extends Banner {

	static propTypes = {
		callToAction: React.PropTypes.string,
		className: React.PropTypes.string,
		description: React.PropTypes.string,
		event: React.PropTypes.string,
		feature: React.PropTypes.string,
		href: React.PropTypes.string,
		icon: React.PropTypes.string,
		list: React.PropTypes.arrayOf( React.PropTypes.string ),
		onClick: React.PropTypes.func,
		plan: React.PropTypes.string,
		siteSlug: React.PropTypes.string,
		title: React.PropTypes.string.isRequired
	};

	static defaultProps = {
		onClick: noop
	};

	render() {
		return this.props.arePromotionsActive
			? <Banner { ...this.props } />
			: null;
	}

}

export default connect(
	state => {
		return {
			arePromotionsActive: arePromotionsActive( state )
		};
	}
)( JetpackBanner );
