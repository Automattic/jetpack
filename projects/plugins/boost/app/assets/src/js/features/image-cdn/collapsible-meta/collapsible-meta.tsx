import styles from './collapsible-meta.module.scss';
import { Button } from '@automattic/jetpack-components';
import React, { useState } from 'react';
import CloseIcon from '$svg/close';
import PencilIcon from '$svg/pencil';

type CollapsibleMetaProps = {
	children: React.ReactNode;
	header: React.ReactNode;
	summary: React.ReactNode;
	editText: string;
};

const CollapsibleMeta = ( { children, header, summary, editText }: CollapsibleMetaProps ) => {
	const [ isEditing, setIsEditing ] = useState( false );
	return (
		<div className={ styles[ 'collapsible-meta' ] }>
			<header className={ styles.header }>
				{ header }
				<Button
					variant="link"
					size="small"
					weight="regular"
					icon={
						isEditing ? (
							<CloseIcon className={ styles[ 'edit-icon' ] } />
						) : (
							<PencilIcon className={ styles[ 'edit-icon' ] } />
						)
					}
					className={ styles[ 'edit-button' ] }
					onClick={ () => {
						setIsEditing( ! isEditing );
					} }
				>
					{ editText }
				</Button>
			</header>

			{ isEditing ? children : <div className={ styles.summary }>{ summary }</div> }
		</div>
	);
};

export default CollapsibleMeta;
