import React from 'react';
import { Snackbar } from '@wordpress/components';
import { useNotices } from './context';
import styles from './manager.module.scss';
import classNames from 'classnames';

const NoticeManager = () => {
	const { notices, removeNotice } = useNotices();

	return (
		Object.keys( notices ).length > 0 && (
			<div className={ classNames( 'stackable-snackbars', styles.wrapper ) }>
				{ Object.values( notices ).map( notice => (
					<Snackbar
						type={ notice.type }
						key={ notice.id }
						onDismiss={ () => removeNotice( notice.id ) }
					>
						{ notice.message }
					</Snackbar>
				) ) }
			</div>
		)
	);
};

export default NoticeManager;
