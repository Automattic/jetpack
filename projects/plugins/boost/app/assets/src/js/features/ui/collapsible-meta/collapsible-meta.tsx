import ExceptPanel from './except-panel';
import styles from './collapsible-meta.module.scss';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { IconButton } from '@wordpress/ui';
import { useId, useState } from 'react';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { recordBoostEvent } from '$lib/utils/analytics';
import type { TracksEventProperties } from '$lib/utils/analytics';

type CollapsibleMetaProps = {
	children: ReactNode;
	exceptions?: string[];
	countExceptions?: boolean;
	header?: ReactNode;
	toggleText?: string;
	compactHeader?: boolean;
	tracksEvent?: string;
	tracksEventProps?: TracksEventProperties;
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
	toggleText = '',
	tracksEvent = '',
	tracksEventProps = {},
	compactHeader = false,
	onToggleHandler = () => {},
}: CollapsibleMetaProps ) => {
	const [ isExpanded, setIsExpanded ] = useState( false );
	const contentId = useId();

	const onToggle = () => {
		const newIsExpanded = ! isExpanded;
		setIsExpanded( newIsExpanded );
		onToggleHandler?.( newIsExpanded );
		if ( tracksEvent !== '' ) {
			recordBoostEvent( tracksEvent, {
				status: newIsExpanded ? 'open' : 'close',
				...tracksEventProps,
			} );
		}
	};

	if ( exceptions ) {
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
	 * It displays the header and the toggle button.
	 */
	const sectionHeader = (
		<div className={ clsx( styles.header, { [ styles[ 'compact-header' ] ]: compactHeader } ) }>
			{ header }
			<div className={ styles.actions }>
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
			</div>
		</div>
	);

	/*
	 * The content of the collapsible meta section.
	 * It displays the main content of the expanded section.
	 */
	return (
		<div className={ styles[ 'collapsible-meta' ] }>
			{ sectionHeader }
			<div id={ contentId } hidden={ ! isExpanded }>
				{ isExpanded && children }
			</div>
		</div>
	);
};

export default CollapsibleMeta;
