/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ReactNode } from 'react';
import type { WidgetErrorConfig, WidgetType } from '@automattic/jetpack-widget-primitives';

/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import {
	Component,
	Suspense,
	forwardRef,
	useCallback,
	useId,
	useMemo,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plugins } from '@wordpress/icons';
import { Card, Icon, Stack, Notice, Text, VisuallyHidden } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { WidgetContextProvider } from '../../context/widget-context';
import { DashboardWidgetRender } from '../widget-render';
import styles from './dashboard-widget-chrome.module.css';
import type { DashboardWidget } from '../../types';

type WidgetError = WidgetErrorConfig | true | null;

interface WidgetErrorNoticeProps {
	error: WidgetErrorConfig | true;
}

/**
 *
 * @param root0
 * @param root0.error
 */
function WidgetErrorNotice( { error }: WidgetErrorNoticeProps ) {
	const config: Partial< WidgetErrorConfig > = error === true ? {} : error;
	const defaultMessage = __(
		"We couldn't load this data. Please try again in a moment.",
		'jetpack-widget-dashboard'
	);
	const message = config.message || defaultMessage;

	return (
		<Notice.Root intent="error" spokenMessage={ message }>
			<Notice.Description>{ message }</Notice.Description>
			{ config.action && (
				<Notice.Actions>
					<Notice.ActionButton onClick={ config.action.onClick }>
						{ config.action.label }
					</Notice.ActionButton>
				</Notice.Actions>
			) }
		</Notice.Root>
	);
}

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
}

class WidgetErrorBoundary extends Component< ErrorBoundaryProps, ErrorBoundaryState > {
	state: ErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasError: true };
	}

	render() {
		if ( this.state.hasError ) {
			return (
				<Notice.Root intent="error">
					<Notice.Description>
						{ __( 'This widget encountered an error.', 'jetpack-widget-dashboard' ) }
					</Notice.Description>
				</Notice.Root>
			);
		}
		return this.props.children;
	}
}

/**
 *
 */
function LoadingOverlay() {
	return (
		<Stack justify="center" align="center" className={ styles.loading }>
			<Spinner />
		</Stack>
	);
}

interface UnavailableWidgetProps {
	widgetTypeName: string;
}

/**
 *
 * @param root0
 * @param root0.widgetTypeName
 */
function UnavailableWidget( { widgetTypeName }: UnavailableWidgetProps ) {
	return (
		<>
			<Card.Header>
				<span className={ styles.widgetChromeHeaderIcon } aria-hidden="true">
					<Icon icon={ plugins } />
				</span>
			</Card.Header>
			<Card.Content className={ styles.widgetChromeContent }>
				<Stack
					direction="column"
					justify="center"
					align="center"
					gap="md"
					className={ styles.unavailable }
				>
					<Text>{ __( 'Widget is no longer available.', 'jetpack-widget-dashboard' ) }</Text>
					<Text render={ <code /> }>{ widgetTypeName }</Text>
				</Stack>
			</Card.Content>
		</>
	);
}

interface HeaderProps {
	titleId: string;
	widgetType: WidgetType;
}

/**
 *
 * @param root0
 * @param root0.titleId
 * @param root0.widgetType
 */
function Header( { titleId, widgetType }: HeaderProps ) {
	if ( ! widgetType.title ) {
		return null;
	}

	return (
		<Card.Header>
			<Stack direction="row" align="center" gap="sm">
				{ widgetType.icon && (
					<span className={ styles.widgetChromeHeaderIcon } aria-hidden="true">
						<Icon icon={ widgetType.icon } />
					</span>
				) }
				<Card.Title id={ titleId } render={ <h3 /> }>
					{ widgetType.title }
				</Card.Title>
			</Stack>
		</Card.Header>
	);
}

export interface DashboardWidgetChromeProps {
	widget: DashboardWidget< unknown >;
	index: number;
	/**
	 * Lifted by the surrounding `@automattic/jetpack-grid` surface into a sibling
	 * slot of the grid item; not rendered by `DashboardWidgetChrome` itself.
	 * Living outside `Card.Root` is what keeps these controls interactive
	 * while edit mode applies `inert` to the chrome.
	 */
	actionableArea?: ReactNode;
	className?: string;
}

/**
 * Per-instance wrapper. Owns the chrome around a widget instance: identity
 * context, header (title + icon), edit-mode `inert` attribute, and the
 * error/loading boundaries that keep neighbours mounted when one widget fails
 * or is still resolving.
 */
export const DashboardWidgetChrome = forwardRef< HTMLDivElement, DashboardWidgetChromeProps >(
	function DashboardWidgetChrome( { widget, index, className }, ref ) {
		const { widgetTypes, isResolvingWidgetTypes, editMode } = useDashboardInternalContext();
		const widgetType = widgetTypes.find( t => t.name === widget.type );
		const titleId = useId();
		const [ error, setErrorState ] = useState< WidgetError >( null );
		const setError = useCallback( ( next: WidgetError ) => {
			setErrorState( next );
		}, [] );

		const contextValue = useMemo(
			() => ( {
				uuid: widget.uuid,
				name: widget.type,
				index,
			} ),
			[ widget.uuid, widget.type, index ]
		);

		if ( ! widgetType ) {
			if ( isResolvingWidgetTypes ) {
				return (
					<WidgetContextProvider value={ contextValue }>
						<Card.Root
							render={ <section /> }
							ref={ ref }
							className={ clsx( styles.widgetChrome, className ) }
							aria-busy="true"
							aria-label={ __( 'Loading', 'jetpack-widget-dashboard' ) }
						>
							<Card.Content className={ styles.widgetChromeContent }>
								<LoadingOverlay />
							</Card.Content>
						</Card.Root>
					</WidgetContextProvider>
				);
			}

			return (
				<WidgetContextProvider value={ contextValue }>
					<Card.Root
						render={ <section /> }
						ref={ ref }
						className={ clsx( styles.widgetChrome, className ) }
						aria-label={ __( 'Missing widget', 'jetpack-widget-dashboard' ) }
					>
						<UnavailableWidget widgetTypeName={ widget.type } />
					</Card.Root>
				</WidgetContextProvider>
			);
		}

		// `presentation` encodes two independent axes. `full-bleed` hides
		// the header; both `full-bleed` and `content-bleed` let the body
		// break out of the content padding.
		const { presentation } = widgetType;
		const isHeaderHidden = presentation === 'full-bleed';
		const isBodyBleeding = presentation === 'full-bleed' || presentation === 'content-bleed';
		const header = <Header titleId={ titleId } widgetType={ widgetType } />;

		const body = (
			<WidgetErrorBoundary>
				<Suspense fallback={ <LoadingOverlay /> }>
					{ error && <WidgetErrorNotice error={ error } /> }
					<DashboardWidgetRender
						widget={ widget }
						widgetType={ widgetType }
						setError={ setError }
					/>
				</Suspense>
			</WidgetErrorBoundary>
		);

		return (
			<WidgetContextProvider value={ contextValue }>
				<Card.Root
					render={ <section /> }
					ref={ ref }
					className={ clsx( styles.widgetChrome, className ) }
					aria-labelledby={ widgetType.title ? titleId : undefined }
					inert={ editMode ? 'true' : undefined }
				>
					{ isHeaderHidden ? <VisuallyHidden>{ header }</VisuallyHidden> : header }

					<Card.Content
						className={ clsx(
							styles.widgetChromeContent,
							isBodyBleeding && styles.widgetChromeContentBleed
						) }
					>
						{ isBodyBleeding ? (
							<Card.FullBleed className={ styles.widgetChromeBleedScroll }>{ body }</Card.FullBleed>
						) : (
							body
						) }
					</Card.Content>
				</Card.Root>
			</WidgetContextProvider>
		);
	}
);
