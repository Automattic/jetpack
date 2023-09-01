import { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
	fetchBackupUndoEvent,
	hasLoadedBackupUndoEvent,
	isFetchingBackupUndoEvent,
} from 'state/at-a-glance';

class QueryBackupUndoEvent extends Component {
	componentDidMount() {
		if ( ! this.props.fetchingBackupUndoEvent && ! this.props.hasLoadedBackupUndoEvent ) {
			this.props.fetchBackupUndoEvent();
		}
	}

	render() {
		return null;
	}
}

QueryBackupUndoEvent.defaultProps = {
	fetchBackupUndoEvent: () => {},
};

export default connect(
	state => {
		return {
			fetchBackupUndoEvent,
			fetchingBackupUndoEvent: isFetchingBackupUndoEvent( state ),
			hasLoadedBackupUndoEvent: hasLoadedBackupUndoEvent( state ),
		};
	},
	dispatch => {
		return bindActionCreators(
			{
				fetchBackupUndoEvent,
			},
			dispatch
		);
	}
)( QueryBackupUndoEvent );
