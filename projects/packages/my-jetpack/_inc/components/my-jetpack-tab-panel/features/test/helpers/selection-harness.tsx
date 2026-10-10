import { BulkBar } from '../../bulk-bar';
import { FeatureList, UnswitchableNote } from '../../feature-list';
import { useFeatureSelection } from '../../use-feature-selection';
import type { FeatureState } from '../../feature-state';

type HarnessProps = {
	states?: FeatureState[];
	groups?: Array< { label: string; states: FeatureState[] } >;
	canDeactivatePlugins?: boolean;
};

/**
 * The tab's shape, for tests: one bulk bar over the features and, where given, the grouped
 * modules below, sharing the one selection the way the Features tab does.
 *
 * @param {HarnessProps}   props                      - The component props.
 * @param {FeatureState[]} props.states               - The features.
 * @param {Array}          props.groups               - The modules, grouped under a heading.
 * @param {boolean}        props.canDeactivatePlugins - Whether plugins may be switched off in bulk.
 * @return The rendered component.
 */
export function SelectionHarness( {
	states = [],
	groups,
	canDeactivatePlugins = true,
}: HarnessProps ) {
	const selection = useFeatureSelection(
		[ ...states, ...( groups ?? [] ).flatMap( group => group.states ) ],
		canDeactivatePlugins
	);

	return (
		<>
			<BulkBar selection={ selection } />
			<UnswitchableNote />
			{ states.length > 0 && (
				<FeatureList states={ states } selection={ selection } onOpen={ jest.fn() } />
			) }
			{ groups?.map( group => (
				<section key={ group.label }>
					<h3>{ group.label }</h3>
					<FeatureList states={ group.states } selection={ selection } showIcon={ false } />
				</section>
			) ) }
		</>
	);
}
