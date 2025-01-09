import { getRedirectUrl } from '@automattic/jetpack-components';
import { useAnalytics, useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import { Warning, useBlockProps } from '@wordpress/block-editor';
import { Button, ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __, sprintf } from '@wordpress/i18n';

const setCustomMissingMessage = BlockEdit => props => {
	const isOfflineMode = window?.Jetpack_Blocks_Status?.isOfflineMode || false;
	const isBlocksActive = window?.Jetpack_Blocks_Status?.isBlocksActive || false;
	const {
		name,
		attributes: { originalName },
	} = props;

	if ( name !== 'core/missing' ) {
		return <BlockEdit key="edit" { ...props } />;
	}

	if ( ! originalName.startsWith( 'jetpack/' ) ) {
		return <BlockEdit key="edit" { ...props } />;
	}

	let actions = [];
	let messageHTML = createInterpolateElement(
		sprintf(
			/* translators: %s: block name */
			__(
				'Jetpack’s offline mode is currently active on your site. The "%s" block is consequently disabled.<br/><a>Learn more about Jetpack’s offline mode</a>.',
				'jetpack'
			),
			originalName
		),
		{
			a: <ExternalLink href={ getRedirectUrl( 'jetpack-support-development-mode' ) } />,
			br: <br />,
		}
	);

	if ( ! isOfflineMode && ! isBlocksActive ) {
		const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
			useModuleStatus( 'blocks' );
		const { tracks } = useAnalytics();
		const enableBlocksModuleOrRefresh = () => {
			if ( isModuleActive ) {
				window.location.reload();
				return;
			}

			tracks.recordEvent( 'jetpack_editor_blocks_enable' );
			return changeStatus( true );
		};
		const isLoading = isChangingStatus || isLoadingModules;

		let ctaMessage = __( 'Activate Jetpack Blocks', 'jetpack' );
		if ( isLoadingModules ) {
			ctaMessage = __( 'Loading', 'jetpack' );
		}
		if ( isChangingStatus ) {
			ctaMessage = __( 'Activating Jetpack Blocks', 'jetpack' );
		}
		if ( isModuleActive ) {
			ctaMessage = __( 'Refresh the page to access all Jetpack blocks', 'jetpack' );
		}

		actions = [
			<Button
				key="activate"
				disabled={ isLoading }
				isBusy={ isLoading }
				onClick={ enableBlocksModuleOrRefresh }
				variant="primary"
			>
				{ ctaMessage }
			</Button>,
		];
		messageHTML = sprintf(
			/* translators: %s: block name */
			__(
				'Jetpack’s blocks are currently disabled on your site. To use the "%s" block, you will need to activate Jetpack blocks first.',
				'jetpack'
			),
			originalName
		);
	}

	return (
		<div { ...useBlockProps() }>
			<Warning actions={ actions }>{ messageHTML }</Warning>
		</div>
	);
};

addFilter( 'editor.BlockEdit', 'jetpack/missing-blocks-message', setCustomMissingMessage );
