import { Component } from 'react';
import { connect } from 'react-redux';
import { fetchSiteDiscount, isFetchingSiteDiscount } from 'state/site';

class QuerySiteDiscount extends Component {
	static defaultProps = {
		isFetchingSiteDiscount: false,
	};

	componentDidMount() {
		if ( ! this.props.isFetchingSiteDiscount ) {
			this.props.fetchSiteDiscount();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => ( {
		isFetchingSiteDiscount: isFetchingSiteDiscount( state ),
	} ),
	dispatch => ( {
		fetchSiteDiscount: () => dispatch( fetchSiteDiscount() ),
	} )
)( QuerySiteDiscount );
