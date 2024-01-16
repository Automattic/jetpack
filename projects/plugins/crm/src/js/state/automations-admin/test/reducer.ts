import { Step, Workflow } from 'crm/state/automations-admin/types';
import {
	hydrateWorkflows,
	activateWorkflow,
	deactivateWorkflow,
	setAttribute,
	selectWorkflow,
	deselectWorkflow,
	selectAllWorkflows,
	deselectAllWorkflows,
	activateSelectedWorkflows,
	deactivateSelectedWorkflows,
} from '../actions';
import { automations, AutomationsState } from '../reducer';
import { getWorkflow, workflowOne, workflowThree, workflowTwo, getStep } from './util/data';

describe( 'Automations Reducer', () => {
	const defaultAutomationsState: AutomationsState = { workflows: {}, selectedWorkflows: [] };

	describe( 'automations', () => {
		describe( 'hydrateWorkflows', () => {
			test( 'creates the state when hydrating empty', () => {
				const inputWorkflows = [ workflowOne, workflowTwo ];

				const action = hydrateWorkflows( inputWorkflows );
				const state = automations( defaultAutomationsState, action );

				expect( state.workflows ).toEqual( {
					[ workflowOne.id ]: workflowOne,
					[ workflowTwo.id ]: workflowTwo,
				} );
			} );

			test( 'replaces the state when hydrating with existing state', () => {
				const inputWorkflows = [ workflowOne, workflowTwo ];
				const initialWorkflows = { [ workflowThree.id ]: workflowThree };

				const action = hydrateWorkflows( inputWorkflows );
				const state = automations(
					{ ...defaultAutomationsState, workflows: initialWorkflows },
					action
				);

				expect( Object.keys( state.workflows ).map( key => Number( key ) ) ).toEqual( [
					workflowOne.id,
					workflowTwo.id,
				] );
				expect( state.workflows[ workflowOne.id ] ).toMatchObject( workflowOne );
				expect( state.workflows[ workflowTwo.id ] ).toMatchObject( workflowTwo );
			} );
		} );

		describe( 'activation and deactivation', () => {
			let initialState: AutomationsState;
			let activeWorkflow: Workflow;
			let inactiveWorkflow: Workflow;
			const activeWorkflowId = 1;
			const inactiveWorkflowId = 2;
			const nonExistingWorkflowId = 3;

			beforeEach( () => {
				activeWorkflow = getWorkflow( activeWorkflowId, 'Active Workflow', { active: true } );
				inactiveWorkflow = getWorkflow( inactiveWorkflowId, 'Inactive Workflow', {
					active: false,
				} );
				initialState = automations(
					defaultAutomationsState,
					hydrateWorkflows( [ activeWorkflow, inactiveWorkflow ] )
				);
			} );

			describe( 'activateWorkflow', () => {
				test( 'activates the selected workflow if it was inactive', () => {
					const action = activateWorkflow( inactiveWorkflowId );
					const newState = automations( initialState, action );
					expect( newState.workflows[ inactiveWorkflowId ].active ).toBe( true );
				} );

				test( 'leaves the selected workflow active if it was active', () => {
					const action = activateWorkflow( activeWorkflowId );
					const newState = automations( initialState, action );
					expect( newState.workflows[ activeWorkflowId ].active ).toBe( true );
				} );

				test( 'does not alter the state of an unselected workflow', () => {
					const action = activateWorkflow( activeWorkflowId );
					const newState = automations( initialState, action );
					expect( newState.workflows[ inactiveWorkflowId ].active ).toBe( false );
				} );

				test( 'does not alter anything if the selected workflow does not exist', () => {
					const action = activateWorkflow( nonExistingWorkflowId );
					const newState = automations( initialState, action );
					expect( newState.workflows[ activeWorkflowId ].active ).toBe( true );
					expect( newState.workflows[ inactiveWorkflowId ].active ).toBe( false );
				} );
			} );

			describe( 'deactivateWorkflow', () => {
				test( 'deactivates the selected workflow if it was active', () => {
					const action = deactivateWorkflow( activeWorkflowId );
					const newState = automations( initialState, action );
					expect( newState.workflows[ activeWorkflowId ].active ).toBe( false );
				} );

				test( 'leaves the selected workflow inactive if it was inactive', () => {
					const action = deactivateWorkflow( inactiveWorkflowId );
					const newState = automations( initialState, action );
					expect( newState.workflows[ inactiveWorkflowId ].active ).toBe( false );
				} );

				test( 'does not alter the state of an unselected workflow', () => {
					const action = deactivateWorkflow( inactiveWorkflowId );
					const newState = automations( initialState, action );
					expect( newState.workflows[ activeWorkflowId ].active ).toBe( true );
				} );

				test( 'does not alter anything if the selected workflow does not exist', () => {
					const action = deactivateWorkflow( nonExistingWorkflowId );
					const newState = automations( initialState, action );
					expect( newState.workflows[ activeWorkflowId ].active ).toBe( true );
					expect( newState.workflows[ inactiveWorkflowId ].active ).toBe( false );
				} );
			} );
		} );

		describe( 'setAttribute', () => {
			let initialState: AutomationsState;
			let stepOne: Step;
			let stepTwo: Step;
			let stepThree: Step;
			let workflow: Workflow;

			const stepOneInitialAttributes = {
				stepOneUnchangedKey: 'stepOneUnchangedValue',
				stepOneChangedKey: 'stepOneChangedValue',
			};
			const stepTwoInitialAttributes = {
				stepTwoUnchangedKey: 'stepTwoUnchangedValue',
				stepTwoChangedKey: 'stepTwoChangedValue',
			};
			const stepThreeInitialAttributes = {
				stepThreeUnchangedKey: 'stepThreeUnchangedValue',
				stepThreeChangedKey: 'stepThreeChangedValue',
			};

			beforeEach( () => {
				stepOne = getStep( 'step_one', 'Step One', {
					attributes: stepOneInitialAttributes,
				} );
				stepTwo = getStep( 'step_two', 'Step Two', {
					attributes: stepTwoInitialAttributes,
				} );
				stepThree = getStep( 'step_three', 'Step Three', {
					attributes: stepThreeInitialAttributes,
				} );
				stepOne.next_step = stepTwo.id;
				stepTwo.next_step = stepThree.id;
				workflow = getWorkflow( 1, 'Workflow', {
					initial_step: stepOne.id,
					steps: {
						[ stepOne.id ]: stepOne,
						[ stepTwo.id ]: stepTwo,
						[ stepThree.id ]: stepThree,
					},
				} );
				initialState = {
					workflows: { [ workflow.id ]: workflow },
					selectedWorkflows: [],
				};
			} );

			test( 'does not alter state if the workflow is not found', () => {
				const action = setAttribute( -1, stepOne.id, 'key', 'value' );

				const newState = automations( initialState, action );

				expect( newState.workflows ).toEqual( initialState.workflows );
			} );

			test( 'does not alter state if the step is not found', () => {
				const action = setAttribute( 1, 'null', 'key', 'value' );

				const newState = automations( initialState, action );

				expect( newState.workflows ).toEqual( initialState.workflows );
			} );

			test( 'sets the attributes on the initial step', () => {
				const newAttributeValue = 'newValue';

				const action = setAttribute(
					workflow.id,
					stepOne.id,
					'stepOneChangedKey',
					newAttributeValue
				);
				const newState = automations( initialState, action );

				expect( newState.workflows[ workflow.id ].steps[ stepOne.id ].attributes ).toEqual( {
					...stepOneInitialAttributes,
					stepOneChangedKey: newAttributeValue,
				} );
				expect( newState.workflows[ workflow.id ].steps[ stepTwo.id ].attributes ).toEqual(
					stepTwoInitialAttributes
				);
				expect( newState.workflows[ workflow.id ].steps[ stepThree.id ].attributes ).toEqual(
					stepThreeInitialAttributes
				);
			} );

			test( 'sets the attributes on a middle step', () => {
				const newAttributeValue = 'newValue';

				const action = setAttribute(
					workflow.id,
					stepTwo.id,
					'stepTwoChangedKey',
					newAttributeValue
				);
				const newState = automations( initialState, action );

				expect( newState.workflows[ workflow.id ].steps[ stepOne.id ].attributes ).toEqual(
					stepOneInitialAttributes
				);
				expect( newState.workflows[ workflow.id ].steps[ stepTwo.id ].attributes ).toEqual( {
					...stepTwoInitialAttributes,
					stepTwoChangedKey: newAttributeValue,
				} );
				expect( newState.workflows[ workflow.id ].steps[ stepThree.id ].attributes ).toEqual(
					stepThreeInitialAttributes
				);
			} );

			test( 'sets the attributes on a final step', () => {
				const newAttributeValue = 'newValue';

				const action = setAttribute(
					workflow.id,
					stepThree.id,
					'stepThreeChangedKey',
					newAttributeValue
				);
				const newState = automations( initialState, action );

				expect( newState.workflows[ workflow.id ].steps[ stepOne.id ].attributes ).toEqual(
					stepOneInitialAttributes
				);
				expect( newState.workflows[ workflow.id ].steps[ stepTwo.id ].attributes ).toEqual(
					stepTwoInitialAttributes
				);
				expect( newState.workflows[ workflow.id ].steps[ stepThree.id ].attributes ).toEqual( {
					...stepThreeInitialAttributes,
					stepThreeChangedKey: newAttributeValue,
				} );
			} );
		} );

		describe( 'selectWorkflow', () => {
			test( 'adds the workflow to the selectedWorkflows array if it is not already selected', () => {
				const action = selectWorkflow( 1 );
				const newState = automations( defaultAutomationsState, action );
				expect( newState.selectedWorkflows ).toEqual( [ 1 ] );
			} );

			test( 'does not duplicate the workflow in the selectedWorkflows array if it is already selected', () => {
				const initialState = { ...defaultAutomationsState, selectedWorkflows: [ 1 ] };
				const action = selectWorkflow( 1 );
				const newState = automations( initialState, action );
				expect( newState.selectedWorkflows ).toEqual( [ 1 ] );
			} );

			test( 'adds a second workflow to the selectedWorkflows array if one is already selected', () => {
				const initialState = { ...defaultAutomationsState, selectedWorkflows: [ 1 ] };
				const action = selectWorkflow( 2 );
				const newState = automations( initialState, action );
				expect( newState.selectedWorkflows ).toEqual( [ 1, 2 ] );
			} );
		} );

		describe( 'deselectWorkflow', () => {
			test( 'removes the workflow from the selectedWorkflows array if it is selected', () => {
				const initialState = { ...defaultAutomationsState, selectedWorkflows: [ 1 ] };
				const action = deselectWorkflow( 1 );
				const newState = automations( initialState, action );
				expect( newState.selectedWorkflows ).toEqual( [] );
			} );

			test( 'does not alter the selectedWorkflows array if the workflow is not selected', () => {
				const initialState = { ...defaultAutomationsState, selectedWorkflows: [ 1 ] };
				const action = deselectWorkflow( 2 );
				const newState = automations( initialState, action );
				expect( newState.selectedWorkflows ).toEqual( [ 1 ] );
			} );

			test( 'does not alter the selectedWorkflows array if it is empty', () => {
				const initialState = { ...defaultAutomationsState, selectedWorkflows: [] };
				const action = deselectWorkflow( 1 );
				const newState = automations( initialState, action );
				expect( newState.selectedWorkflows ).toEqual( [] );
			} );
		} );

		describe( 'selectAllWorkflows', () => {
			test( 'selects all workflows if none are selected', () => {
				const initialState = {
					workflows: { [ workflowOne.id ]: workflowOne, [ workflowTwo.id ]: workflowTwo },
					selectedWorkflows: [],
				};
				const action = selectAllWorkflows();
				const newState = automations( initialState, action );
				expect( newState.selectedWorkflows ).toEqual( [ workflowOne.id, workflowTwo.id ] );
			} );

			test( 'selects all workflows if some are selected', () => {
				const initialState = {
					workflows: { [ workflowOne.id ]: workflowOne, [ workflowTwo.id ]: workflowTwo },
					selectedWorkflows: [ workflowOne.id ],
				};
				const action = selectAllWorkflows();
				const newState = automations( initialState, action );
				expect( newState.selectedWorkflows ).toEqual( [ workflowOne.id, workflowTwo.id ] );
			} );

			test( 'does not alter the selectedWorkflows array if all workflows are already selected', () => {
				const initialState = {
					workflows: { [ workflowOne.id ]: workflowOne, [ workflowTwo.id ]: workflowTwo },
					selectedWorkflows: [ workflowOne.id, workflowTwo.id ],
				};
				const action = selectAllWorkflows();
				const newState = automations( initialState, action );
				expect( newState.selectedWorkflows ).toEqual( [ workflowOne.id, workflowTwo.id ] );
			} );
		} );

		describe( 'deselectAllWorkflows', () => {
			test( 'deselects all workflows if all are selected', () => {
				const initialState = {
					workflows: { [ workflowOne.id ]: workflowOne, [ workflowTwo.id ]: workflowTwo },
					selectedWorkflows: [ workflowOne.id, workflowTwo.id ],
				};
				const action = deselectAllWorkflows();
				const newState = automations( initialState, action );
				expect( newState.selectedWorkflows ).toEqual( [] );
			} );

			test( 'deselects all workflows if some are selected', () => {
				const initialState = {
					workflows: { [ workflowOne.id ]: workflowOne, [ workflowTwo.id ]: workflowTwo },
					selectedWorkflows: [ workflowOne.id ],
				};
				const action = deselectAllWorkflows();
				const newState = automations( initialState, action );
				expect( newState.selectedWorkflows ).toEqual( [] );
			} );

			test( 'does not alter the selectedWorkflows array if none are selected', () => {
				const initialState = {
					workflows: { [ workflowOne.id ]: workflowOne, [ workflowTwo.id ]: workflowTwo },
					selectedWorkflows: [],
				};
				const action = deselectAllWorkflows();
				const newState = automations( initialState, action );
				expect( newState.selectedWorkflows ).toEqual( [] );
			} );
		} );

		describe( 'activateSelectedWorkflows', () => {
			test( 'activates selected workflows if none are active', () => {
				const initialState = {
					workflows: {
						[ workflowOne.id ]: { ...workflowOne, active: false },
						[ workflowTwo.id ]: { ...workflowTwo, active: false },
					},
					selectedWorkflows: [ workflowOne.id, workflowTwo.id ],
				};
				const action = activateSelectedWorkflows();
				const newState = automations( initialState, action );
				expect( newState.workflows[ workflowOne.id ].active ).toBe( true );
				expect( newState.workflows[ workflowTwo.id ].active ).toBe( true );
			} );

			test( 'activates selected workflows if some are active', () => {
				const initialState = {
					workflows: {
						[ workflowOne.id ]: { ...workflowOne, active: true },
						[ workflowTwo.id ]: { ...workflowTwo, active: false },
					},
					selectedWorkflows: [ workflowOne.id, workflowTwo.id ],
				};
				const action = activateSelectedWorkflows();
				const newState = automations( initialState, action );
				expect( newState.workflows[ workflowOne.id ].active ).toBe( true );
				expect( newState.workflows[ workflowTwo.id ].active ).toBe( true );
			} );

			test( 'activates the correct workflows if only some are selected', () => {
				const initialState = {
					workflows: {
						[ workflowOne.id ]: { ...workflowOne, active: false },
						[ workflowTwo.id ]: { ...workflowTwo, active: false },
					},
					selectedWorkflows: [ workflowOne.id ],
				};
				const action = activateSelectedWorkflows();
				const newState = automations( initialState, action );
				expect( newState.workflows[ workflowOne.id ].active ).toBe( true );
				expect( newState.workflows[ workflowTwo.id ].active ).toBe( false );
			} );
		} );

		describe( 'deactivateSelectedWorkflows', () => {
			test( 'deactivates selected workflows if all are active', () => {
				const initialState = {
					workflows: {
						[ workflowOne.id ]: { ...workflowOne, active: true },
						[ workflowTwo.id ]: { ...workflowTwo, active: true },
					},
					selectedWorkflows: [ workflowOne.id, workflowTwo.id ],
				};
				const action = deactivateSelectedWorkflows();
				const newState = automations( initialState, action );
				expect( newState.workflows[ workflowOne.id ].active ).toBe( false );
				expect( newState.workflows[ workflowTwo.id ].active ).toBe( false );
			} );

			test( 'deactivates selected workflows if some are active', () => {
				const initialState = {
					workflows: {
						[ workflowOne.id ]: { ...workflowOne, active: true },
						[ workflowTwo.id ]: { ...workflowTwo, active: false },
					},
					selectedWorkflows: [ workflowOne.id, workflowTwo.id ],
				};
				const action = deactivateSelectedWorkflows();
				const newState = automations( initialState, action );
				expect( newState.workflows[ workflowOne.id ].active ).toBe( false );
				expect( newState.workflows[ workflowTwo.id ].active ).toBe( false );
			} );

			test( 'deactivates the correct workflows if only some are selected', () => {
				const initialState = {
					workflows: {
						[ workflowOne.id ]: { ...workflowOne, active: true },
						[ workflowTwo.id ]: { ...workflowTwo, active: true },
					},
					selectedWorkflows: [ workflowOne.id ],
				};
				const action = deactivateSelectedWorkflows();
				const newState = automations( initialState, action );
				expect( newState.workflows[ workflowOne.id ].active ).toBe( false );
				expect( newState.workflows[ workflowTwo.id ].active ).toBe( true );
			} );
		} );
	} );
} );
