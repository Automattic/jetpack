import { Text } from '@automattic/jetpack-components';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './style.module.scss';

export const CardWrapper = props => {
	const { children, className } = props;

	const containerClassName = classNames( styles.container, className );

	return <div className={ containerClassName }>{ children }</div>;
};

const Card = props => {
	const { title, headerRightContent, className, children } = props;

	return (
		<CardWrapper className={ className }>
			<div className={ styles.title }>
				<div className={ styles.name }>
					<Text variant="title-medium">{ title }</Text>
				</div>
				{ headerRightContent }
			</div>
			{ children }
		</CardWrapper>
	);
};

Card.propTypes = {
	children: PropTypes.node,
	title: PropTypes.string.isRequired,
	className: PropTypes.string,
	headerRightContent: PropTypes.node,
};

export default Card;
