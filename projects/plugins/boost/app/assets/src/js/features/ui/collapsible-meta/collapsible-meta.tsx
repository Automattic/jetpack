import { useModuleSurface } from '$features/module/surface';
import ExceptPanel from './except-panel';
import styles from './collapsible-meta.module.scss';
import { Button } from '@automattic/jetpack-components';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { IconButton } from '@wordpress/ui';
import { useId, useState } from 'react';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import ChevronDown from '$svg/chevron-down';
import ChevronUp from '$svg/chevron-up';
import { recordBoostEvent } from '$lib/utils/analytics';

type CollapsibleMetaProps = {
	children: ReactNode;
	exceptions?: string[];
	countExceptions?: boolean;
	header?: ReactNode;
	summary?: ReactNode;
	toggleText: string;
	headerText?: string;
	compactHeader?: boolean;
	tracksEvent?: string;
	extraButtons?: ReactNode;
	onToggleHandler?: ( isExpanded: boolean ) => void;
};

/*
 * This component is used to create a collapsible meta section for modules on the settings page.
 */
const CollapsibleMeta = ( {
	children,
	exceptions,
	countExceptions = false,
	header = null,
	summary = null,
	toggleText = '',
	tracksEvent = '',
	extraButtons = null,
	headerText = '',
	compactHeader = false,
	onToggleHandler = () => {},
}: CollapsibleMetaProps ) => {
	const [ isExpanded, setIsExpanded ] = useState( false );
	const isRow = useModuleSurface() === 'row';
	const contentId = useId();

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

	if ( isRow && exceptions ) {
		return (
			<ExceptPanel
				exceptions={ exceptions }
				countExceptions={ countExceptions }
				isExpanded={ isExpanded }
				onToggle={ onToggle }
			>
				{ children }
			</ExceptPanel>
		);
	}

	/*
	 * The header of the collapsible meta section.
	 * It displays the header, extra buttons and the toggle button.
	 */
	const sectionHeader = (
		<div className={ clsx( styles.header, { [ styles[ 'compact-header' ] ]: compactHeader } ) }>
			{ header ? header : <div className={ styles.summary }>{ headerText }</div> }
			<div className={ clsx( styles.actions, { [ styles[ 'row-actions' ] ]: isRow } ) }>
				{ extraButtons && extraButtons }{ ' ' }
				{ isRow ? (
					<IconButton
						icon={ isExpanded ? chevronUp : chevronDown }
						label={ toggleText }
						size="small"
						variant="minimal"
						tone="neutral"
						aria-expanded={ isExpanded }
						aria-controls={ contentId }
						onClick={ onToggle }
					/>
				) : (
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
				) }
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
			{ isRow ? (
				<div id={ contentId } hidden={ ! isExpanded }>
					{ isExpanded && children }
				</div>
			) : (
				<>
					{ isExpanded ? children : summary && <div className={ styles.summary }>{ summary }</div> }
				</>
			) }
		</div>
	);
};

export default CollapsibleMeta;
