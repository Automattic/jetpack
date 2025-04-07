import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';
import styles from './lcp.module.scss';
import { Button } from '@automattic/jetpack-components';
import RefreshIcon from '$svg/refresh';
import { useSingleModuleState } from '$features/module/lib/stores';
import { useNotices } from '$features/notice/context';
import { recordBoostEvent } from '$lib/utils/analytics';

const Lcp = () => {
	const { setNotice } = useNotices();
	const [ moduleState, setModuleState ] = useSingleModuleState( 'lcp', active => {
		const activatedMessage = __( 'LCP optimization enabled', 'jetpack-boost' );
		const deactivatedMessage = __( 'LCP optimization disabled', 'jetpack-boost' );

		setNotice( {
			id: 'update-module-state',
			type: 'success',
			message: active ? activatedMessage : deactivatedMessage,
		} );
	} );

	const lcpEnabled = moduleState?.active ?? false;

	const handleToggle = ( value: boolean ) => {
		setModuleState( value );
		recordBoostEvent( 'cornerstone_pages_lcp_toggle', { enabled: Number( value ) } );
	};

	return (
		<div className={ styles.wrapper }>
			<div className={ styles.title }>
				<h4>{ __( 'Optimize LCP', 'jetpack-boost' ) }</h4>
				<ToggleControl
					className={ styles[ 'toggle-control' ] }
					checked={ lcpEnabled }
					onChange={ handleToggle }
					__nextHasNoMarginBottom={ true }
				/>
			</div>
			<div className={ styles.description }>
				{ __( 'Improve the largest contentful paint (LCP).', 'jetpack-boost' ) }
			</div>
			<div className={ styles.status }>
				<div className={ styles.summary }>
					<div className={ styles.successes }>
						{ __( '5 pages optimized 10 minutes ago.', 'jetpack-boost' ) }
					</div>
				</div>

				<Button
					className={ styles[ 'regenerate-button' ] }
					variant="link"
					size="small"
					weight="regular"
					icon={ <RefreshIcon /> }
				>
					{ __( 'Optimize', 'jetpack-boost' ) }
				</Button>
			</div>
		</div>
	);
};

export default Lcp;
