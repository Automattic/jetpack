import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Link, Notice, Stack, SwitchControl, Text } from '@wordpress/ui';
import { geoStore } from '../../data/geo-store';
import { GEO_PATH, writePreloaded } from '../../data/get-preloaded';
import type { GeoState } from '../../data/geo-types';

interface SharingStatus {
	prevent_sharing: boolean;
	locked: boolean;
	privacy_url: string;
}

const PATH = '/jetpack/v4/seo/data-sharing';
const unconfirmedMessage = __(
	'The sharing preference could not be confirmed. Reload this page before trying again.',
	'jetpack-seo'
);

const DataSharingSettings = ( {
	disabled = false,
	visibility,
	onSavingChange,
}: {
	disabled?: boolean;
	visibility: string;
	onSavingChange?: ( saving: boolean ) => void;
} ) => {
	const [ status, setStatus ] = useState< SharingStatus | null >( null );
	const [ hasCurrentStatus, setHasCurrentStatus ] = useState( false );
	const [ busy, setBusy ] = useState( false );
	const [ error, setError ] = useState( '' );
	const { setCrawlers } = useDispatch( geoStore );
	const visibilityRevision = useRef( 0 );

	useEffect( () => {
		let active = true;
		++visibilityRevision.current;
		setHasCurrentStatus( false );
		// The parent keeps controls disabled until its writes and settings readback settle.
		if ( ! disabled ) {
			setError( '' );
			apiFetch< SharingStatus >( { path: PATH } ).then(
				value => {
					if ( active ) {
						setStatus( value );
						setHasCurrentStatus( true );
					}
				},
				() =>
					active &&
					setError(
						__(
							'Unable to load the sharing preference. Reload this page to try again.',
							'jetpack-seo'
						)
					)
			);
		}
		return () => {
			active = false;
			// eslint-disable-next-line react-hooks/exhaustive-deps -- This numeric generation invalidates pending requests during cleanup.
			++visibilityRevision.current;
		};
	}, [ visibility, disabled ] );

	const save = useCallback(
		async ( preventSharing: boolean ) => {
			const revision = visibilityRevision.current;
			setBusy( true );
			onSavingChange?.( true );
			setError( '' );
			try {
				let updated: SharingStatus;
				let saveFailed = false;
				try {
					updated = await apiFetch< SharingStatus >( {
						path: PATH,
						method: 'POST',
						data: { prevent_sharing: preventSharing },
					} );
				} catch {
					// A failed response can follow a persisted write. Confirm storage before
					// showing a value or offering a retry.
					saveFailed = true;
					try {
						updated = await apiFetch< SharingStatus >( { path: PATH } );
					} catch {
						if ( revision === visibilityRevision.current ) {
							setStatus( null );
							setError( unconfirmedMessage );
						}
						return;
					}
				}
				// A visibility change may have replaced this request with a newer restriction.
				if ( revision !== visibilityRevision.current ) {
					return;
				}
				setStatus( updated );
				if ( updated.prevent_sharing !== preventSharing ) {
					setError(
						saveFailed
							? __( 'Unable to save the sharing preference. Please try again.', 'jetpack-seo' )
							: unconfirmedMessage
					);
					return;
				}
				try {
					const geo = await apiFetch< GeoState >( { path: GEO_PATH } );
					if ( revision !== visibilityRevision.current ) {
						return;
					}
					writePreloaded( GEO_PATH, geo );
					setCrawlers( geo.crawlers );
				} catch {
					if ( revision !== visibilityRevision.current ) {
						return;
					}
					setError(
						__(
							'The preference was saved, but crawler status could not be refreshed. Reload this page to see the latest status.',
							'jetpack-seo'
						)
					);
				}
			} finally {
				setBusy( false );
				onSavingChange?.( false );
			}
		},
		[ setCrawlers, onSavingChange ]
	);

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h2 /> }>{ __( 'Third-party sharing', 'jetpack-seo' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					<Text render={ <p /> }>
						{ __(
							'Prevent WordPress.com from sharing your public content with licensed content and research partners, including partners that train AI models. This is separate from search indexing and your individual AI crawler preferences.',
							'jetpack-seo'
						) }
					</Text>
					{ error && (
						<Notice.Root intent="error">
							<Notice.Description>{ error }</Notice.Description>
						</Notice.Root>
					) }
					{ status ? (
						<SwitchControl
							label={ __( 'Prevent third-party sharing', 'jetpack-seo' ) }
							checked={ status.locked || status.prevent_sharing }
							disabled={ disabled || busy || ! hasCurrentStatus || status.locked }
							onCheckedChange={ save }
						/>
					) : (
						! error && (
							<Text render={ <p /> }>{ __( 'Loading sharing preference…', 'jetpack-seo' ) }</Text>
						)
					) }
					{ status?.locked && (
						<Text render={ <p /> }>
							{ __(
								'Your site visibility settings already prevent sharing. Change those settings before changing this preference.',
								'jetpack-seo'
							) }{ ' ' }
							<Link href={ status.privacy_url }>
								{ __( 'Manage site visibility', 'jetpack-seo' ) }
							</Link>
						</Text>
					) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

export default DataSharingSettings;
