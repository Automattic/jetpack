import { Component } from 'react';
import { connect } from 'react-redux';
import { fetchSiteBenefits, isFetchingSiteBenefits } from 'state/site';

class QuerySiteBenefits extends Component {
	static defaultProps = {
		isFetchingSiteBenefitsData: false,
	};

	componentDidMount() {
		if ( ! this.props.isFetchingSiteBenefits ) {
			this.props.fetchSiteBenefits();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => ( {
		isFetchingSiteBenefits: isFetchingSiteBenefits( state ),
	} ),
	dispatch => ( {
		fetchSiteBenefits: () => dispatch( fetchSiteBenefits() ),
	} )
)( QuerySiteBenefits );
