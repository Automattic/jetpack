import styles from './collapsible-meta.module.scss';
import { Button } from '@automattic/jetpack-components';
import React, { useState } from 'react';
import ChevronDown from '$svg/chevron-down';
import ChevronUp from '$svg/chevron-up';
import { recordBoostEvent } from '$lib/utils/analytics';

type CollapsibleMetaProps = {
	children: React.ReactNode;
	header?: React.ReactNode;
	summary?: React.ReactNode;
	toggleText: string;
	headerText?: string;
	tracksEvent?: string;
	extraButtons?: React.ReactNode;
	onToggleHandler?: ( isExpanded: boolean ) => void;
};

/*
 * This component is used to create a collapsible meta section for modules on the settings page.
 */
const CollapsibleMeta = ( {
	children,
	header = null,
	summary = null,
	toggleText = '',
	tracksEvent = '',
	extraButtons = null,
	headerText = '',
	onToggleHandler = () => {},
}: CollapsibleMetaProps ) => {
	const [ isExpanded, setIsExpanded ] = useState( false );

	const onToggle = () => {
		const newIsExpanded = ! isExpanded;
		setIsExpanded( newIsExpanded );
		onToggleHandler?.( newIsExpanded );
		if ( tracksEvent !== '' ) {
			recordBoostEvent( tracksEvent, {
				status: newIsExpanded ? 'open' : 'close',
			} );
		}
	};

	/*
	 * The header of the collapsible meta section.
	 * It displays the header, extra buttons and the toggle button.
	 */
	const sectionHeader = (
		<div className={ styles.header }>
			{ header ? header : <div className={ styles.summary }>{ headerText }</div> }
			<div className={ styles.actions }>
				{ extraButtons && extraButtons }{ ' ' }
				<Button
					variant="link"
					size="small"
					weight="regular"
					icon={ isExpanded ? <ChevronUp /> : <ChevronDown /> }
					className={ styles[ 'edit-button' ] }
					onClick={ onToggle }
				>
					{ toggleText }
				</Button>
			</div>
		</div>
	);

	/*
	 * The content of the collapsible meta section.
	 * It displays the (toggle, extra) buttons, main content of the expanded section or the summary.
	 */
	return (
		<div className={ styles[ 'collapsible-meta' ] }>
			{ sectionHeader }
			{ isExpanded ? children : summary && <div className={ styles.summary }>{ summary }</div> }
		</div>
	);
};

export default CollapsibleMeta;
