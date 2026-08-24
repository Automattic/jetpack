import styles from './collapsible-meta.module.scss';
import { Button, Collapsible } from '@wordpress/ui';
import { useState } from 'react';
import type { ReactNode } from 'react';
import ChevronDown from '$svg/chevron-down';
import ChevronUp from '$svg/chevron-up';
import { recordBoostEvent } from '$lib/utils/analytics';

type CollapsibleMetaProps = {
	children: ReactNode;
	header?: ReactNode;
	summary?: ReactNode;
	toggleText: string;
	headerText?: string;
	tracksEvent?: string;
	extraButtons?: ReactNode;
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

	const onOpenChange = ( open: boolean ) => {
		setIsExpanded( open );
		onToggleHandler?.( open );
		if ( tracksEvent !== '' ) {
			recordBoostEvent( tracksEvent, {
				status: open ? 'open' : 'close',
			} );
		}
	};

	return (
		<Collapsible.Root
			className={ styles[ 'collapsible-meta' ] }
			open={ isExpanded }
			onOpenChange={ onOpenChange }
		>
			<div className={ styles.header }>
				{ header ? header : <div className={ styles.summary }>{ headerText }</div> }
				<div className={ styles.actions }>
					{ extraButtons && extraButtons }{ ' ' }
					<Collapsible.Trigger
						render={
							<Button variant="minimal" size="compact" className={ styles[ 'edit-button' ] } />
						}
					>
						<Button.Icon icon={ isExpanded ? <ChevronUp /> : <ChevronDown /> } />
						{ toggleText }
					</Collapsible.Trigger>
				</div>
			</div>
			<Collapsible.Panel>{ children }</Collapsible.Panel>
			{ ! isExpanded && summary && <div className={ styles.summary }>{ summary }</div> }
		</Collapsible.Root>
	);
};

export default CollapsibleMeta;
