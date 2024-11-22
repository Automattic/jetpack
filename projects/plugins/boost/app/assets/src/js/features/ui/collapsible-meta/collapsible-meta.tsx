import styles from './collapsible-meta.module.scss';
import { Button } from '@automattic/jetpack-components';
import React, { useState } from 'react';
import CloseIcon from '$svg/close';
import PencilIcon from '$svg/pencil';
import ChevronDown from '$svg/chevron-down';
import ChevronUp from '$svg/chevron-up';
import { recordBoostEvent } from '$lib/utils/analytics';

type CollapsibleMetaProps = {
	children: React.ReactNode;
	header: React.ReactNode;
	summary: React.ReactNode;
	editText: string;
	useChevron?: boolean;
	isExpandedExternal?: boolean;
	setIsExpandedExternal?: ( value: boolean ) => void;
	tracksEvent?: string;
};

const CollapsibleMeta = ( {
	children,
	header,
	summary,
	editText,
	isExpandedExternal,
	setIsExpandedExternal,
	useChevron = true,
	tracksEvent = '',
}: CollapsibleMetaProps ) => {
	const [ isExpandedInternal, setIsExpandedInternal ] = useState( false );

	// Use external state if provided, otherwise use internal state
	const isExpanded = isExpandedExternal !== undefined ? isExpandedExternal : isExpandedInternal;
	const setIsExpanded = setIsExpandedExternal || setIsExpandedInternal;

	const togglePanel = () => {
		setIsExpanded( ! isExpanded );

		if ( tracksEvent !== '' ) {
			recordBoostEvent( tracksEvent, {
				status: ! isExpanded ? 'open' : 'close',
			} );
		}
	};

	const getIcon = () => {
		if ( useChevron ) {
			return isExpanded ? <ChevronUp /> : <ChevronDown />;
		}
		return isExpanded ? (
			<CloseIcon className={ styles[ 'edit-icon' ] } />
		) : (
			<PencilIcon className={ styles[ 'edit-icon' ] } />
		);
	};

	return (
		<div className={ styles[ 'collapsible-meta' ] }>
			<header className={ styles.header }>
				{ header }
				<Button
					variant="link"
					size="small"
					weight="regular"
					icon={ getIcon() }
					className={ styles[ 'edit-button' ] }
					onClick={ togglePanel }
				>
					{ editText }
				</Button>
			</header>

			{ isExpanded ? children : <div className={ styles.summary }>{ summary }</div> }
		</div>
	);
};

export default CollapsibleMeta;
