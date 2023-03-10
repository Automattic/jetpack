import { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { isFetchingAkismetData, fetchAkismetData } from 'state/at-a-glance';

class QueryAkismetData extends Component {
	UNSAFE_componentWillMount() {
		if ( ! this.props.fetchingAkismetData ) {
			this.props.fetchAkismetData();
		}
	}

	render() {
		return null;
	}
}

QueryAkismetData.defaultProps = {
	fetchAkismetData: () => {},
};

export default connect(
	state => {
		return {
			fetchAkismetData: fetchAkismetData(),
			fetchingAkismetData: isFetchingAkismetData( state ),
		};
	},
	dispatch => {
		return bindActionCreators(
			{
				fetchAkismetData,
			},
			dispatch
		);
	}
)( QueryAkismetData );
