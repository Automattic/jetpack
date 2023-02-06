import { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { isCheckingAkismetKey, checkAkismetKey } from 'state/at-a-glance';

class QueryAkismetKeyCheck extends Component {
	UNSAFE_componentWillMount() {
		if ( ! this.props.isCheckingAkismetKey ) {
			this.props.checkAkismetKey();
		}
	}

	render() {
		return null;
	}
}

QueryAkismetKeyCheck.defaultProps = {
	checkAkismetKey: () => {},
};

export default connect(
	state => {
		return {
			checkAkismetKey: checkAkismetKey(),
			isCheckingAkismetKey: isCheckingAkismetKey( state ),
		};
	},
	dispatch => {
		return bindActionCreators(
			{
				checkAkismetKey,
			},
			dispatch
		);
	}
)( QueryAkismetKeyCheck );
