import styles from './collapsible-meta.module.scss';
import { Button } from '@automattic/jetpack-components';
import React, { useState, useEffect } from 'react';
import ChevronDown from '$svg/chevron-down';
import ChevronUp from '$svg/chevron-up';
import { recordBoostEvent } from '$lib/utils/analytics';

type CollapsibleMetaProps = {
	children: React.ReactNode;
	header?: React.ReactNode;
	summary?: React.ReactNode;
	toggleText: string;
	headerText?: string;
	useChevron?: boolean;
	tracksEvent?: string;
	extraButtons?: React.ReactNode;
	onToggleHandler?: ( isExpanded: boolean ) => void;
};

/*
 * This component is used to create a collapsible meta section.
 * This is used by the modules on the settings page to create a more consistent UI.
 * The toggleText and tracksEvent props are used by every module.
 * headerText is used by Page Cache and Minify modules.
 * The Quality Settings module uses the header prop to render a custom header.
 * The extraButtons prop is used to render a custom set of buttons, for example, the "Clear Cache" button.
 * The onToggleHandler prop is a callback function that is called when the collapsible meta is toggled. Used by Minify module to reset the input value.
 */
const CollapsibleMeta = ( {
	children,
	header,
	summary,
	toggleText,
	tracksEvent = '',
	extraButtons,
	headerText,
	onToggleHandler,
}: CollapsibleMetaProps ) => {
	const [ isExpanded, setIsExpanded ] = useState( false );

	/*
	 * A callback function that is called when the collapsible meta is toggled.
	 * The callback function is passed as a prop to the component and is called with the new state.
	 */
	useEffect( () => {
		onToggleHandler?.( isExpanded );
	}, [ isExpanded, onToggleHandler ] );

	useEffect( () => {
		if ( tracksEvent !== '' ) {
			recordBoostEvent( tracksEvent, {
				status: isExpanded ? 'open' : 'close',
			} );
		}
	}, [ isExpanded, tracksEvent ] );

	/*
	 * The header of the collapsible meta section.
	 * It displays the header, extra buttons and the toggle button.
	 */
	const sectionHeader = (
		<div className={ styles.header }>
			{ header ? header : <div className={ styles.summary }>{ headerText }</div> }
			<div className={ styles.actions }>
				{ extraButtons }{ ' ' }
				<Button
					variant="link"
					size="small"
					weight="regular"
					icon={ isExpanded ? <ChevronUp /> : <ChevronDown /> }
					className={ styles[ 'edit-button' ] }
					onClick={ () => {
						setIsExpanded( ! isExpanded );
					} }
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
