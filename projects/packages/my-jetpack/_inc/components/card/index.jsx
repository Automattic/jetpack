import { Text } from '@automattic/jetpack-components';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import styles from './style.module.scss';

export const CardWrapper = props => {
	const { children, className, onMouseEnter, onMouseLeave } = props;

	const containerClassName = clsx( styles.container, className );

	return (
		<div
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
			onFocus={ onMouseEnter }
			onBlur={ onMouseLeave }
			className={ containerClassName }
		>
			{ children }
		</div>
	);
};

const Card = props => {
	const { title, headerRightContent, className, children, onMouseEnter, onMouseLeave, titleId } =
		props;

	return (
		<CardWrapper
			className={ className }
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
		>
			<div className={ styles.title }>
				<div className={ styles.name }>
					<Text variant="title-medium" id={ titleId || null }>
						{ title }
					</Text>
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
	onMouseEnter: PropTypes.func,
	onMouseLeave: PropTypes.func,
	titleId: PropTypes.string,
};

export default Card;
