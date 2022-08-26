import classnames from 'classnames';
import PropTypes from 'prop-types';
import styles from './styles.module.scss';

const Notice = ( { children, type = 'default' } ) => {
	const className = classnames( styles.notice, styles[ `notice--${ type }` ] );

	return <div className={ className }>{ children }</div>;
};

Notice.propTypes = {
	children: PropTypes.node.isRequired,
	type: PropTypes.oneOf( [ 'default', 'warning' ] ),
};

export default Notice;
