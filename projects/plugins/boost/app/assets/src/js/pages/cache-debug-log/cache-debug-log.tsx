import { __ } from '@wordpress/i18n';
import BoostAdminPage from '$layout/boost-admin-page/boost-admin-page';
import styles from './cache-debug-log.module.scss';
import clsx from 'clsx';
import {
	Button,
	CheckmarkIcon,
	ClipboardIcon,
	JetpackFooter,
	JetpackLogo,
} from '@automattic/jetpack-components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useRef, useState } from '@wordpress/element';
import { useDebugLog } from '$features/page-cache/lib/stores';
import { useNavigate } from 'react-router';
import { recordBoostEvent } from '$lib/utils/analytics';
import {
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';

/**
 * Button that copies the given text to the clipboard and briefly swaps its icon to a checkmark.
 *
 * @param {object} props      - Component props.
 * @param {string} props.text - Text to copy.
 * @return {JSX.Element} Rendered button.
 */
const CopyDebugLogButton = ( { text }: { text: string } ) => {
	const [ hasCopied, setHasCopied ] = useState( false );
	const copyTimer = useRef< ReturnType< typeof setTimeout > | undefined >( undefined );

	const copyRef = useCopyToClipboard< HTMLElement >( text, () => {
		if ( copyTimer.current ) {
			clearTimeout( copyTimer.current );
		}
		setHasCopied( true );
		copyTimer.current = setTimeout( () => {
			setHasCopied( false );
			copyTimer.current = undefined;
		}, 3000 );
	} );

	useEffect(
		() => () => {
			if ( copyTimer.current ) {
				clearTimeout( copyTimer.current );
			}
		},
		[]
	);

	const copyLabel = __( 'Copy to clipboard', 'jetpack-boost' );

	return (
		<Button
			ref={ copyRef }
			aria-label={ copyLabel }
			icon={ hasCopied ? <CheckmarkIcon /> : <ClipboardIcon /> }
			className={ styles[ 'copy-button' ] }
			variant="link"
			weight="regular"
		>
			{ copyLabel }
		</Button>
	);
};

const CacheDebugLog = () => {
	const [ { data: debugLog } ] = useDebugLog();
	const navigate = useNavigate();

	const handleBack = ( e: React.MouseEvent ) => {
		e.preventDefault();
		recordBoostEvent( 'back_button_clicked', {
			current_page: window.location.href.replace( window.location.origin, '' ),
			destination: '/',
		} );
		navigate( '/' );
	};

	const breadcrumbs = (
		<nav aria-label={ __( 'Breadcrumbs', 'jetpack-boost' ) } className={ styles.breadcrumbs }>
			<HStack
				as="ul"
				className="admin-ui-breadcrumbs__list"
				spacing={ 0 }
				justify="flex-start"
				alignment="center"
			>
				<li>
					<a href="#/" onClick={ handleBack } className={ styles[ 'breadcrumb-link' ] }>
						<JetpackLogo showText={ false } height={ 20 } />
						{ 'Boost' /** "Boost" is a product name, do not translate. */ }
					</a>
				</li>
				<li>
					<h1 className={ styles[ 'breadcrumb-current' ] }>
						{ __( 'Cache debug log', 'jetpack-boost' ) }
					</h1>
				</li>
			</HStack>
		</nav>
	);

	return (
		<BoostAdminPage breadcrumbs={ breadcrumbs }>
			<div id="jb-dashboard" className="jb-dashboard jb-dashboard--main">
				<div className={ clsx( 'jb-section jb-section--main', styles.section ) }>
					<div className="jb-container">
						<div id="jp-admin-notices" className="jetpack-boost-jitm-card" />
						<header className={ styles.header }>
							<h3>{ __( 'Jetpack Boost Cache Log Viewer', 'jetpack-boost' ) }</h3>
							<CopyDebugLogButton text={ debugLog || '' } />
						</header>

						<pre className={ styles[ 'log-text' ] }>{ debugLog }</pre>
					</div>
				</div>
				<JetpackFooter />
			</div>
		</BoostAdminPage>
	);
};

export default CacheDebugLog;
