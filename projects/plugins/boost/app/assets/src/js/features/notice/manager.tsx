import React, { useEffect } from 'react';
import { Snackbar } from '@wordpress/components';
import { MutationNotice, useNotices } from './context';
import styles from './manager.module.scss';
import classNames from 'classnames';

type NoticeProps = {
	notice: MutationNotice;
	onDismiss: () => void;
};
const Notice = ( { notice, onDismiss }: NoticeProps ) => {
	useEffect( () => {
		const timer = setTimeout( () => {
			onDismiss();
		}, 2000 );

		return () => clearTimeout( timer );
	}, [ onDismiss ] );

	return (
		<Snackbar type={ notice.type } key={ notice.id } onDismiss={ onDismiss }>
			{ notice.message }
		</Snackbar>
	);
};

const NoticeManager = () => {
	const { notices, removeNotice } = useNotices();

	return (
		Object.keys( notices ).length > 0 && (
			<div className={ classNames( 'stackable-snackbars', styles.wrapper ) }>
				{ Object.values( notices ).map( notice => (
					<Notice
						key={ notice.id }
						notice={ notice }
						onDismiss={ () => removeNotice( notice.id ) }
					/>
				) ) }
			</div>
		)
	);
};

export default NoticeManager;
