import { Text } from '@automattic/jetpack-components';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './style.module.scss';

const Card = props => {
	const { title, headerRightContent, className, children } = props;

	const containerClassName = classNames( styles.container, className );

	return (
		<div className={ containerClassName }>
			<div className={ styles.title }>
				<div className={ styles.name }>
					<Text variant="title-medium">{ title }</Text>
				</div>
				{ headerRightContent }
			</div>
			{ children }
		</div>
	);
};

Card.propTypes = {
	children: PropTypes.node,
	title: PropTypes.string.isRequired,
	className: PropTypes.string,
	headerRightContent: PropTypes.node,
};

export default Card;
