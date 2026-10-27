/**
 * External dependencies
 */
import { act, render, waitFor, type RenderOptions } from '@testing-library/react';
import { WidgetHostProvider, WidgetRender } from '@wordpress/widget-primitives';
import { Suspense } from 'react';
import type {
	ResolveWidgetModule,
	WidgetAction,
	WidgetRenderProps,
	WidgetRuntimeAction,
	WidgetType,
} from '@wordpress/widget-primitives';
import type { ComponentType, ReactElement, ReactNode } from 'react';

/**
 * A widget host that records the actions a widget declares, as the dashboard would place them.
 *
 * @return The host to render the widget under, and readers of its current actions.
 */
export function createWidgetActionsHost() {
	const declare = jest.fn();
	const host = { actions: { declare } };

	/**
	 * Render a widget under the recording host.
	 *
	 * @param props          - Component props.
	 * @param props.children - The widget under test.
	 * @return The provider.
	 */
	function WidgetActionsHost( { children }: { children: ReactNode } ) {
		return <WidgetHostProvider value={ host }>{ children }</WidgetHostProvider>;
	}

	// The widget's current actions: the last list it declared.
	const declaredActions = (): WidgetRuntimeAction[] => declare.mock.calls.at( -1 )?.[ 0 ] ?? [];
	const declaredAction = ( id: string ) => declaredActions().find( action => action.id === id );
	const declaredLink = ( id: string ): WidgetAction | undefined => {
		const action = declaredAction( id );

		return action && 'href' in action ? action : undefined;
	};

	return {
		WidgetActionsHost,
		declaredActions,
		declaredAction,
		declaredLink,
		// Waits for the widget to declare the action, the way the chrome shows it once it does.
		findDeclaredAction: ( id: string ) =>
			waitFor( () => {
				const action = declaredAction( id );
				expect( action ).toBeDefined();
				return action as WidgetRuntimeAction;
			} ),
		// Runs a callback action the way the chrome does on a click.
		runDeclaredAction: async ( id: string ) => {
			const action = declaredAction( id );
			if ( ! action || ! ( 'callback' in action ) ) {
				throw new Error( `No callback action "${ id }" is declared.` );
			}
			await act( async () => {
				await action.callback();
			} );
		},
	};
}

/**
 * Render a widget under a recording host.
 *
 * @param ui      - The widget.
 * @param options - Render options.
 * @return The render result plus the host's action readers.
 */
export function renderWithActionsHost(
	ui: ReactElement,
	options?: Omit< RenderOptions, 'wrapper' >
) {
	const host = createWidgetActionsHost();

	return { ...render( ui, { ...options, wrapper: host.WidgetActionsHost } ), ...host };
}

type WidgetModule = Awaited< ReturnType< ResolveWidgetModule > >;

const testWidgetModules = new Map< string, WidgetModule >();

/**
 * Resolve a render module registered by `renderInWidgetRender`.
 *
 * @param renderModule - The render module id.
 * @return The widget module.
 */
async function resolveTestWidgetModule( renderModule: string ) {
	return testWidgetModules.get( renderModule ) as WidgetModule;
}

/**
 * Render a widget through `WidgetRender`, which joins the actions of every `useWidgetActions` call the way the dashboard does. `renderWithActionsHost` keeps only the last call's list.
 *
 * @param component  - The widget's render component.
 * @param attributes - The widget's attributes.
 * @return The render result plus the host's action readers, once the widget has declared its actions.
 */
export async function renderInWidgetRender< Item >(
	component: ComponentType< WidgetRenderProps< Item > >,
	attributes: Item
) {
	const host = createWidgetActionsHost();
	const renderModule = `test/${ component.name }`;
	testWidgetModules.set( renderModule, { default: component } as WidgetModule );
	const view = render(
		<Suspense fallback={ null }>
			<WidgetRender
				widgetType={ { renderModule } as WidgetType< Item > }
				attributes={ attributes }
				resolveWidgetModule={ resolveTestWidgetModule }
			/>
		</Suspense>,
		{ wrapper: host.WidgetActionsHost }
	);
	await waitFor( () => expect( host.declaredActions() ).not.toHaveLength( 0 ) );

	return { ...view, ...host };
}
