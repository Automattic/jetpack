import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';
import styles from './prerender.module.scss';
import { recordBoostEvent } from '$lib/utils/analytics';
import { createInterpolateElement, useCallback, useRef, useState } from '@wordpress/element';

import { Link } from '@wordpress/ui';

import { getRedirectUrl, IconTooltip } from '@automattic/jetpack-components';
import { useSingleModuleState } from '$features/module/lib/stores';
import ModuleRow from '$features/module/module-row';
import { useModuleSurface, useTooltipLayer } from '$features/module/surface';
import { useNotices } from '$features/notice/context';
const unsafeSpeculationRulesLink = getRedirectUrl( 'jetpack-boost-unsafe-speculation-rules' );
import type { ReactNode } from 'react';

const Prerender = () => {
	const surface = useModuleSurface();
	const { setNotice } = useNotices();
	const [ moduleState, setModuleState ] = useSingleModuleState( 'speculation_rules', active => {
		const activatedMessage = __( 'Prerender enabled', 'jetpack-boost' );
		const deactivatedMessage = __( 'Prerender disabled', 'jetpack-boost' );

		setNotice( {
			id: 'update-module-state',
			type: 'success',
			message: active ? activatedMessage : deactivatedMessage,
		} );
	} );

	const speculationRulesEnabled = moduleState?.active ?? false;

	const handleToggle = ( value: boolean ) => {
		setModuleState( value );
		recordBoostEvent( 'cornerstone_pages_prerender_toggle', { enabled: Number( value ) } );
	};

	const title = __( 'Prerender Cornerstone Pages', 'jetpack-boost' );
	const description = createInterpolateElement(
		__(
			'Prerender these pages to improve their loading performance, but <help>be mindful</help> of potential drawbacks.',
			'jetpack-boost'
		),
		{
			help: <PrerenderWarningMessage />,
		}
	);

	if ( surface === 'row' ) {
		return (
			<ModuleRow
				testId="prerender-cornerstone-pages-title"
				label={ title }
				description={ description }
				toggle={ { checked: speculationRulesEnabled, onChange: handleToggle } }
			/>
		);
	}

	return (
		<div className={ styles.wrapper }>
			<div className={ styles.title } data-testid="prerender-cornerstone-pages-title">
				<h4>{ title }</h4>
				<ToggleControl
					className={ styles[ 'toggle-control' ] }
					checked={ speculationRulesEnabled }
					onChange={ handleToggle }
					__nextHasNoMarginBottom={ true }
				/>
			</div>
			<div className={ styles.description }>{ description }</div>
		</div>
	);
};

type BypassPatternsExampleProps = {
	children?: ReactNode;
};

const PrerenderWarningMessage = ( { children }: BypassPatternsExampleProps ) => {
	const [ show, setShow ] = useState( false );
	const triggerRef = useRef< HTMLButtonElement >( null );
	const tooltipLayer = useTooltipLayer();
	const toggleTooltip = useCallback( () => {
		recordBoostEvent( 'prerender_warning_message_clicked', {} );
		setShow( value => ! value );
	}, [] );
	const closeTooltip = useCallback( () => setShow( false ), [] );

	return (
		<div className={ styles[ 'warning-wrapper' ] }>
			<button
				type="button"
				ref={ triggerRef }
				aria-expanded={ show }
				className={ styles[ 'warning-button' ] }
				onClick={ toggleTooltip }
			>
				{ children }
			</button>
			<div className={ styles[ 'warning-tooltip-wrapper' ] }>
				<IconTooltip
					placement="bottom-end"
					popoverAnchorStyle="wrapper"
					forceShow={ show }
					triggerRef={ triggerRef }
					onClose={ closeTooltip }
					offset={ -10 }
					popoverClassName={ styles[ 'warning-tooltip' ] }
					{ ...tooltipLayer }
				>
					<strong>{ __( 'Warning', 'jetpack-boost' ) }</strong>
					<br />
					{ __(
						'Prerendering pages can be unsafe if the pages are not properly configured. JavaScript will execute on the prerendered page. This can lead to unexpected behavior if not handled correctly.',
						'jetpack-boost'
					) }
					<br />
					{ createInterpolateElement( __( '<link>Learn more</link>', 'jetpack-boost' ), {
						link: <Link openInNewTab href={ unsafeSpeculationRulesLink } />,
					} ) }
				</IconTooltip>
			</div>
		</div>
	);
};

export default Prerender;
