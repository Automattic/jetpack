/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import InfoPopover from 'components/info-popover';

/**
 * Style dependencies
 */
import './style.scss';

const CheckboxAnswer = ( { title, info } ) => {
	return (
		<div className="jp-checkbox-answer__container">
			<div className="jp-checkbox-answer__checkbox">
				<input type="checkbox" />
			</div>
			<div className="jp-checkbox-answer__title">{ title }</div>
			<div className="jp-checkbox-answer__info">
				<InfoPopover position="top right">{ info }</InfoPopover>
			</div>
		</div>
	);
};

CheckboxAnswer.propTypes = {
	title: PropTypes.string.isRequired,
	info: PropTypes.string.isRequired,
};

export { CheckboxAnswer };
