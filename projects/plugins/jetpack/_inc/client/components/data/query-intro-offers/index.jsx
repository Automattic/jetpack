import { Component } from 'react';
import { connect } from 'react-redux';
import { fetchIntroOffers, isFetchingIntroOffers } from 'state/intro-offers';

class QueryIntroOffers extends Component {
	static defaultProps = {
		isFetchingIntroOffers: false,
	};

	componentDidMount() {
		if ( ! this.props.isFetchingIntroOffers ) {
			this.props.fetchIntroOffers();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => ( {
		isFetchingIntroOffers: isFetchingIntroOffers( state ),
	} ),
	dispatch => ( {
		fetchIntroOffers: () => dispatch( fetchIntroOffers() ),
	} )
)( QueryIntroOffers );
