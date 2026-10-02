import RawData from './core.json';

// `string & {}` still accepts any string, but lets editors suggest `isCore.Module` names
declare function isCore(specifier: isCore.Module | (string & {}), nodeVersion?: string): boolean;

declare namespace isCore {
	export type Module = keyof typeof RawData;

	export type Data = Record<Module, typeof RawData[Module]>;
}

export = isCore;
