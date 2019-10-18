/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';

const PlanCard = props => {
	const { header, body } = props.children;

	return (
		<div className="plan-card">
			{ /* TODO: make the className dynamic */ }
			<div className={ classNames( 'plan-card__header', 'is-backup-daily-plan' ) }>{ header }</div>
			<div className="plan-card__body">{ body }</div>
		</div>
	);
};

const PlanCardHeader = props => props.children;
const PlanCardBody = props => props.children;

// TODO: change to work with children
// PlanCard.PropTypes = {
// 	header: PropTypes.objectOf( PlanCardHeader ).isRequired,
// 	body: PropTypes.objectOf( PlanCardBody ).isRequired,
// };

export { PlanCard, PlanCardHeader, PlanCardBody };
