import type { Reducer, StateFromReducersMapObject, ActionFromReducersMapObject } from 'redux';
export declare function combineReducers<M>(reducers: M): M[keyof M] extends Reducer<any, any> | undefined ? Reducer<StateFromReducersMapObject<M>, ActionFromReducersMapObject<M>> : never;
//# sourceMappingURL=combine-reducers.d.ts.map