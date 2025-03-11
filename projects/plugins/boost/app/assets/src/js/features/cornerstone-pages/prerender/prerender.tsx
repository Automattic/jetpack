import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';
import styles from './prerender.module.scss';
import { recordBoostEvent } from '$lib/utils/analytics';
import { useMutationNotice } from '$features/ui';
import { createInterpolateElement, useState } from '@wordpress/element';
import { getRedirectUrl, IconTooltip } from '@automattic/jetpack-components';
import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';
const unsafeSpeculationRulesLink = getRedirectUrl( 'jetpack-boost-unsafe-speculation-rules' );

const Prerender = () => {
	const [ prerenderedEnabled, setPrerenderedEnabled ] = useDataSync(
		'jetpack_boost_ds',
		'prerender_cornerstone_pages',
		z.boolean().catch( false )
	);

	const enabledMessage = __( 'Prerender enabled.', 'jetpack-boost' );
	const disabledMessage = __( 'Prerender disabled.', 'jetpack-boost' );
	useMutationNotice( 'prerender-cornerstone-pages', setPrerenderedEnabled, {
		successMessage: prerenderedEnabled.data ? enabledMessage : disabledMessage,
	} );

	const isWordPressVersionSupported = Jetpack_Boost.wpVersion >= '6.8.0';

	const handleToggle = ( value: boolean ) => {
		setPrerenderedEnabled.mutate( value );
		recordBoostEvent( 'cornerstone_pages_prerender_toggle', { enabled: Number( value ) } );
	};

	return (
		<div className={ styles.wrapper }>
			<div className={ styles.title }>
				<h4>{ __( 'Prerender Cornerstone Pages', 'jetpack-boost' ) }</h4>
				<ToggleControl
					className={ styles[ 'toggle-control' ] }
					checked={ prerenderedEnabled.data }
					onChange={ handleToggle }
					disabled={ ! isWordPressVersionSupported }
					__nextHasNoMarginBottom={ true }
				/>
			</div>
			<div className={ styles.description }>
				{ isWordPressVersionSupported
					? createInterpolateElement(
							__(
								'Prerender these pages to improve their loading performance, but <help>be mindful</help> of potential drawbacks.',
								'jetpack-boost'
							),
							{
								help: <PrerenderWarningMessage />,
								// eslint-disable-next-line jsx-a11y/anchor-has-content
								link: <a href={ unsafeSpeculationRulesLink } target="_blank" rel="noreferrer" />,
							}
					  )
					: __( 'This feature requires WordPress 6.8.0 or later.', 'jetpack-boost' ) }
			</div>
		</div>
	);
};

type BypassPatternsExampleProps = {
	children?: React.ReactNode;
};

const PrerenderWarningMessage = ( { children }: BypassPatternsExampleProps ) => {
	const [ show, setShow ] = useState( false );

	return (
		<div className={ styles[ 'warning-wrapper' ] }>
			{ /* eslint-disable-next-line jsx-a11y/anchor-is-valid */ }
			<a
				href="#"
				className={ styles[ 'warning-button' ] }
				onClick={ e => {
					recordBoostEvent( 'prerender_warning_message_clicked', {} );
					e.preventDefault();
					setShow( ! show );
				} }
			>
				{ children }
			</a>
			<div className={ styles[ 'warning-tooltip-wrapper' ] }>
				<IconTooltip
					placement="bottom-end"
					popoverAnchorStyle="wrapper"
					forceShow={ show }
					offset={ -10 }
					className={ styles[ 'warning-tooltip' ] }
				>
					<strong>{ __( 'Warning', 'jetpack-boost' ) }</strong>
					<br />
					{ __(
						'Prerendering pages can be unsafe if the pages are not properly configured. JavaScript will execute on the prerendered page. This can lead to unexpected behavior if not handled correctly.',
						'jetpack-boost'
					) }
					<br />
					<br />
					{ __( 'Potential risks include:', 'jetpack-boost' ) }
					<ul>
						<li>
							{ __(
								'State modification: JavaScript may modify a shopping cart, analytics, or other state.',
								'jetpack-boost'
							) }
						</li>
						<li>
							{ __(
								'Stale content: The prerendered page may display stale content, such as a shopping cart that has been emptied. Or a logged in page that should be logged out.',
								'jetpack-boost'
							) }
						</li>
					</ul>
					<br />
					{ __( 'Mitigate these risks by:', 'jetpack-boost' ) }
					<br />
					<ul>
						<li>
							{ __(
								'Using the Sec-Purpose: prerender header to defer JavaScript execution until the page is activated.',
								'jetpack-boost'
							) }
						</li>
						<li>
							{ __(
								'Leverage APIs like document.prerendering to detect and delay JavaScript execution during prerendering.',
								'jetpack-boost'
							) }
						</li>
						<li>
							{ __(
								'Using a Promise which waits for the prerenderingchange event if a document is prerendering, or resolves immediately if it is now activated.',
								'jetpack-boost'
							) }
						</li>
					</ul>
					<br />
					{ createInterpolateElement( __( '<link>Learn more</link>', 'jetpack-boost' ), {
						// eslint-disable-next-line jsx-a11y/anchor-has-content
						link: <a href={ unsafeSpeculationRulesLink } target="_blank" rel="noreferrer" />,
					} ) }
				</IconTooltip>
			</div>
		</div>
	);
};

export default Prerender;
