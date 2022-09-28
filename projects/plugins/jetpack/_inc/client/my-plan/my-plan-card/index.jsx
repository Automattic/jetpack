import classNames from 'classnames';
import PlanIcon from 'components/plans/plan-icon/index';
import PropTypes from 'prop-types';
import React from 'react';

import './style.scss';

const MyPlanCard = ( { productSlug, action, isError, isPlaceholder, details, tagLine, title } ) => {
	const cardClassNames = classNames( 'my-plan-card', {
		'is-placeholder': isPlaceholder,
		'has-action-only': action && ! details && ! isPlaceholder,
	} );
	const detailsClassNames = classNames( 'my-plan-card__details', { 'is-error': isError } );

	return (
		<div className={ cardClassNames }>
			<div className="my-plan-card__primary">
				<div className="my-plan-card__icon">
					{ productSlug && <PlanIcon plan={ productSlug } alt={ title } /> }
				</div>
				<div className="my-plan-card__header">
					{ title && <h2 className="my-plan-card__title">{ title }</h2> }
					{ tagLine && <p className="my-plan-card__tag-line">{ tagLine }</p> }
				</div>
			</div>
			{ ( details || action || isPlaceholder ) && (
				<div className="my-plan-card__secondary">
					<div className={ detailsClassNames }>{ isPlaceholder ? null : details }</div>
					<div className="my-plan-card__action">{ isPlaceholder ? null : action }</div>
				</div>
			) }
		</div>
	);
};

MyPlanCard.propTypes = {
	productSlug: PropTypes.string.isRequired,
	action: PropTypes.oneOfType( [ PropTypes.node, PropTypes.element ] ),
	isError: PropTypes.bool,
	isPlaceholder: PropTypes.bool,
	details: PropTypes.oneOfType( [ PropTypes.string, PropTypes.node, PropTypes.element ] ),
	tagLine: PropTypes.oneOfType( [ PropTypes.string, PropTypes.node, PropTypes.element ] ),
	title: PropTypes.oneOfType( [ PropTypes.string, PropTypes.node, PropTypes.element ] ),
};

export default MyPlanCard;
