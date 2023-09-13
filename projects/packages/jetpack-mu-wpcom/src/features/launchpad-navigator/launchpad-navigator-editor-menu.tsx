import { Button, Fill } from '@wordpress/components';
import { useMediaQuery } from '@wordpress/compose';
import { registerPlugin } from '@wordpress/plugins';
import classnames from 'classnames';
import * as React from 'react';
import type PropsWithChildren from 'react';

type PinnedItemScope = 'core/edit-post' | 'core/edit-site' | 'core/edit-widgets';
type PinnedItemsDirectProps = { scope: PinnedItemScope };
type PinnedItemsProps = PropsWithChildren< PinnedItemsDirectProps >;

// Implement PinnedItems to avoid importing @wordpress/interface.
// Because @wordpress/interface depends on @wordpress/preferences which is not always available outside the editor,
// causing the script to not be enqueued due to the missing dependency.
// check https://github.com/Automattic/wp-calypso/pull/74122 for more details.
const PinnedItems = ( { scope, children }: PinnedItemsProps ) => {
	return <Fill name={ `PinnedItems/${ scope }` }>{ children }</Fill>;
};

const LaunchpadNavigatorContents = () => {
	return <div className="wpcom-launchpad-navigator__contents">Test (placeholder)</div>;
};

const LaunchpadNavigatorEditorMenu = () => {
	const [ showLaunchpadNavigatorModal, toggleLaunchpadNavigatorModal ] = React.useState( false );

	const isDesktop = useMediaQuery( '(min-width: 480px)' );

	const launchpadNavigatorButton = (
		<Button
			className={ classnames( 'entry-point-button', 'wpcom-launchpad-navigator', 'is-active' ) }
			onClick={ toggleLaunchpadNavigatorModal }
			icon={ <span>X</span> }
			label="Tasks"
			aria-pressed={ true }
			aria-expanded={ true }
		/>
	);

	return (
		<>
			{ isDesktop && (
				<>
					<PinnedItems scope="core/edit-post">{ launchpadNavigatorButton }</PinnedItems>
					<PinnedItems scope="core/edit-site">{ launchpadNavigatorButton }</PinnedItems>
					<PinnedItems scope="core/edit-widgets">{ launchpadNavigatorButton }</PinnedItems>
				</>
			) }
			showLaunchpadNavigatorModal && (
			{ showLaunchpadNavigatorModal && <LaunchpadNavigatorContents /> }
		</>
	);
};

registerPlugin( 'jetpack-mu-wpcom-launchpad-navigator-menu', {
	render: () => {
		return <LaunchpadNavigatorEditorMenu />;
	},
} );

export default LaunchpadNavigatorEditorMenu;
