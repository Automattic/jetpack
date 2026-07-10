import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';
import styles from './prerender.module.scss';
import { recordBoostEvent } from '$lib/utils/analytics';
import { createInterpolateElement, useState } from '@wordpress/element';

import { Link, Popover } from '@wordpress/ui';

import { getRedirectUrl } from '@automattic/jetpack-components';
import { useSingleModuleState } from '$features/module/lib/stores';
import { useNotices } from '$features/notice/context';
const unsafeSpeculationRulesLink = getRedirectUrl( 'jetpack-boost-unsafe-speculation-rules' );
import type { ReactNode } from 'react';

const Prerender = () => {
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

	return (
		<div className={ styles.wrapper }>
			<div className={ styles.title } data-testid="prerender-cornerstone-pages-title">
				<h4>{ __( 'Prerender Cornerstone Pages', 'jetpack-boost' ) }</h4>
				<ToggleControl
					className={ styles[ 'toggle-control' ] }
					checked={ speculationRulesEnabled }
					onChange={ handleToggle }
					__nextHasNoMarginBottom={ true }
				/>
			</div>
			<div className={ styles.description }>
				{ createInterpolateElement(
					__(
						'Prerender these pages to improve their loading performance, but <help>be mindful</help> of potential drawbacks.',
						'jetpack-boost'
					),
					{
						help: <PrerenderWarningMessage />,
					}
				) }
			</div>
		</div>
	);
};

type BypassPatternsExampleProps = {
	children?: ReactNode;
};

const PrerenderWarningMessage = ( { children }: BypassPatternsExampleProps ) => {
	const [ show, setShow ] = useState( false );

	return (
		<div className={ styles[ 'warning-wrapper' ] }>
			<Popover.Root open={ show } onOpenChange={ setShow }>
				<Popover.Trigger
					render={
						// Content is provided by Popover.Trigger children at render time.
						// eslint-disable-next-line jsx-a11y/anchor-is-valid, jsx-a11y/anchor-has-content
						<a href="#" className={ styles[ 'warning-button' ] } />
					}
					onClick={ ( e: React.MouseEvent ) => {
						recordBoostEvent( 'prerender_warning_message_clicked', {} );
						e.preventDefault();
					} }
				>
					{ children }
				</Popover.Trigger>
				<Popover.Popup className={ styles[ 'warning-tooltip' ] }>
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
				</Popover.Popup>
			</Popover.Root>
		</div>
	);
};

export default Prerender;
