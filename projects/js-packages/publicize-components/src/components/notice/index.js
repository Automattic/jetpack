import { VisuallyHidden } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, closeSmall } from '@wordpress/icons';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import styles from './styles.module.scss';

const Notice = ( { children, type = 'default', actions = [], onDismiss } ) => {
	const className = clsx( styles.notice, styles[ `notice--${ type }` ] );

	return (
		<div className={ className }>
			<div className={ styles.content }> { children } </div>
			{ onDismiss && (
				<button className={ styles.dismiss } onClick={ onDismiss }>
					<VisuallyHidden>{ __( 'Dismiss notice', 'jetpack' ) }</VisuallyHidden>
					<Icon icon={ closeSmall } />
				</button>
			) }
			{ actions && actions.length > 0 && (
				<div className={ styles.actions }>{ actions.map( action => action ) }</div>
			) }
		</div>
	);
};

Notice.propTypes = {
	children: PropTypes.node.isRequired,
	type: PropTypes.oneOf( [ 'default', 'highlight', 'warning', 'error' ] ),
	actions: PropTypes.arrayOf( PropTypes.element ),
	onDismiss: PropTypes.func,
};

export default Notice;
