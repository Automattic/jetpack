const selectors = {
	getIsActionInProgress: state => state.isActionInProgress || false,
	getErrorType: state => state.errorType || null,
};

export default selectors;
