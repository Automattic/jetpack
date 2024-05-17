import React from 'react';
import ErrorGridicon from './error-gridicon';
import './style.scss';

const ErrorMessage = props => {
	const { children } = props;

	return (
		<div className="jp-idc__error-message">
			<ErrorGridicon />
			<span>{ children }</span>
		</div>
	);
};

export default ErrorMessage;
