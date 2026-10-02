"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  createSelector: () => createSelector,
  createSelectorCreator: () => createSelectorCreator,
  createStructuredSelector: () => createStructuredSelector,
  lruMemoize: () => lruMemoize,
  referenceEqualityCheck: () => referenceEqualityCheck,
  setGlobalDevModeChecks: () => setGlobalDevModeChecks,
  weakMapMemoize: () => weakMapMemoize
});
module.exports = __toCommonJS(src_exports);

// src/devModeChecks/cacheSizeCheck.ts
var CACHE_SIZE_CHECK_THRESHOLD = 1e3;
var runCacheSizeCheck = (cacheSize, funcName) => {
  let stack = void 0;
  try {
    throw new Error();
  } catch (e) {
    ;
    ({ stack } = e);
  }
  console.warn(
    `A function memoized with weakMapMemoize${funcName ? ` (\`${funcName}\`)` : ""} has seen over ${cacheSize} distinct values for the same primitive argument position.
Results keyed by primitive arguments are held strongly and are only released by \`clearCache()\`, so this cache will keep growing for as long as the function keeps seeing new values.
If it is called with ever-changing primitives (ids, offsets, timestamps), pass the \`maxSize\` option to bound the cache, switch to \`lruMemoize\`, or call \`.clearCache()\` at a suitable point.
See https://reselect.js.org/api/development-only-checks#cachesizecheck for details.`,
    { stack }
  );
};

// src/devModeChecks/setGlobalDevModeChecks.ts
var globalDevModeChecks = {
  inputStabilityCheck: "once",
  identityFunctionCheck: "once",
  cacheSizeCheck: "once"
};
var setGlobalDevModeChecks = (devModeChecks) => {
  Object.assign(globalDevModeChecks, devModeChecks);
};

// src/weakMapMemoize.ts
var StrongRef = class {
  constructor(value) {
    this.value = value;
  }
  deref() {
    return this.value;
  }
};
var getWeakRef = () => typeof WeakRef === "undefined" ? StrongRef : WeakRef;
var Ref = /* @__PURE__ */ getWeakRef();
var UNTERMINATED = 0;
var TERMINATED = 1;
function createCacheNode() {
  return {
    s: UNTERMINATED,
    v: void 0,
    o: null,
    p: null
  };
}
function maybeDeref(r) {
  if (r instanceof Ref) {
    return r.deref();
  }
  return r;
}
function weakMapMemoize(func, options = {}) {
  let fnNode = createCacheNode();
  const { resultEqualityCheck, maxSize } = options;
  const useGenerations = maxSize !== void 0;
  if (useGenerations && (!Number.isInteger(maxSize) || maxSize < 1)) {
    throw new TypeError(
      `maxSize must be a positive integer, received: ${maxSize}`
    );
  }
  let prevNode = null;
  let insertionCount = 0;
  let lastResult;
  let resultsCount = 0;
  let hasWarnedAboutCacheSize = false;
  function maybeFlipGenerations() {
    if (insertionCount >= maxSize) {
      prevNode = fnNode;
      fnNode = createCacheNode();
      insertionCount = 0;
    }
  }
  function memoized() {
    let cacheNode = fnNode;
    const { length } = arguments;
    for (let i = 0, l = length; i < l; i++) {
      const arg = arguments[i];
      if (typeof arg === "function" || typeof arg === "object" && arg !== null) {
        let objectCache = cacheNode.o;
        if (objectCache === null) {
          cacheNode.o = objectCache = /* @__PURE__ */ new WeakMap();
        }
        const objectNode = objectCache.get(arg);
        if (objectNode === void 0) {
          cacheNode = createCacheNode();
          objectCache.set(arg, cacheNode);
        } else {
          cacheNode = objectNode;
        }
      } else {
        let primitiveCache = cacheNode.p;
        if (primitiveCache === null) {
          cacheNode.p = primitiveCache = /* @__PURE__ */ new Map();
        }
        const primitiveNode = primitiveCache.get(arg);
        if (primitiveNode === void 0) {
          cacheNode = createCacheNode();
          primitiveCache.set(arg, cacheNode);
          insertionCount++;
          if (true) {
            if (primitiveCache.size > CACHE_SIZE_CHECK_THRESHOLD) {
              const { cacheSizeCheck } = globalDevModeChecks;
              if (cacheSizeCheck === "always" || cacheSizeCheck === "once" && !hasWarnedAboutCacheSize) {
                hasWarnedAboutCacheSize = true;
                runCacheSizeCheck(primitiveCache.size, func.name);
              }
            }
          }
        } else {
          cacheNode = primitiveNode;
        }
      }
    }
    if (cacheNode.s === TERMINATED) {
      return cacheNode.v;
    }
    if (prevNode !== null) {
      let prevCacheNode = prevNode;
      for (let i = 0, l = length; i < l; i++) {
        const arg = arguments[i];
        let next;
        if (typeof arg === "function" || typeof arg === "object" && arg !== null) {
          const prevObjectCache = prevCacheNode.o;
          next = prevObjectCache !== null ? prevObjectCache.get(arg) : void 0;
        } else {
          const prevPrimitiveCache = prevCacheNode.p;
          next = prevPrimitiveCache !== null ? prevPrimitiveCache.get(arg) : void 0;
        }
        if (next === void 0) {
          prevCacheNode = null;
          break;
        }
        prevCacheNode = next;
      }
      if (prevCacheNode !== null && prevCacheNode.s === TERMINATED) {
        const promotedNode = cacheNode;
        promotedNode.s = TERMINATED;
        promotedNode.v = prevCacheNode.v;
        maybeFlipGenerations();
        return prevCacheNode.v;
      }
    }
    const terminatedNode = cacheNode;
    let result = func.apply(null, arguments);
    resultsCount++;
    if (resultEqualityCheck) {
      const lastResultValue = maybeDeref(lastResult);
      if (lastResultValue != null && resultEqualityCheck(lastResultValue, result)) {
        result = lastResultValue;
        resultsCount !== 0 && resultsCount--;
      }
      const needsWeakRef = typeof result === "object" && result !== null || typeof result === "function";
      lastResult = needsWeakRef ? /* @__PURE__ */ new Ref(result) : result;
    }
    terminatedNode.s = TERMINATED;
    terminatedNode.v = result;
    if (useGenerations) {
      maybeFlipGenerations();
    }
    return result;
  }
  memoized.clearCache = () => {
    fnNode = createCacheNode();
    prevNode = null;
    insertionCount = 0;
    memoized.resetResultsCount();
    if (true) {
      hasWarnedAboutCacheSize = false;
    }
  };
  memoized.resultsCount = () => resultsCount;
  memoized.resetResultsCount = () => {
    resultsCount = 0;
  };
  return memoized;
}

// src/devModeChecks/identityFunctionCheck.ts
var runIdentityFunctionCheck = (resultFunc, inputSelectorsResults, outputSelectorResult) => {
  if (inputSelectorsResults.length === 1 && inputSelectorsResults[0] === outputSelectorResult) {
    let isInputSameAsOutput = false;
    try {
      const emptyObject = {};
      if (resultFunc(emptyObject) === emptyObject) isInputSameAsOutput = true;
    } catch {
    }
    if (isInputSameAsOutput) {
      let stack = void 0;
      try {
        throw new Error();
      } catch (e) {
        ;
        ({ stack } = e);
      }
      console.warn(
        "The result function returned its own inputs without modification. e.g\n`createSelector([state => state.todos], todos => todos)`\nThis could lead to inefficient memoization and unnecessary re-renders.\nEnsure transformation logic is in the result function, and extraction logic is in the input selectors.",
        { stack }
      );
    }
  }
};

// src/devModeChecks/inputStabilityCheck.ts
var withoutResultEqualityCheck = (option) => {
  if (option === null || typeof option !== "object" || !("resultEqualityCheck" in option)) {
    return option;
  }
  const optionCopy = { ...option };
  delete optionCopy.resultEqualityCheck;
  return optionCopy;
};
var runInputStabilityCheck = (inputSelectorResultsObject, options, inputSelectorArgs) => {
  const { memoize, memoizeOptions } = options;
  const { inputSelectorResults, inputSelectorResultsCopy } = inputSelectorResultsObject;
  const probeMemoizeOptions = [];
  const { length } = memoizeOptions;
  for (let i = 0; i < length; i++) {
    probeMemoizeOptions.push(withoutResultEqualityCheck(memoizeOptions[i]));
  }
  const createAnEmptyObject = memoize(() => ({}), ...probeMemoizeOptions);
  const areInputSelectorResultsEqual = createAnEmptyObject.apply(null, inputSelectorResults) === createAnEmptyObject.apply(null, inputSelectorResultsCopy);
  if (!areInputSelectorResultsEqual) {
    let stack = void 0;
    try {
      throw new Error();
    } catch (e) {
      ;
      ({ stack } = e);
    }
    console.warn(
      "An input selector returned a different result when passed same arguments.\nThis means your output selector will likely run more frequently than intended.\nAvoid returning a new reference inside your input selector, e.g.\n`createSelector([state => state.todos.map(todo => todo.id)], todoIds => todoIds.length)`",
      {
        arguments: inputSelectorArgs,
        firstInputs: inputSelectorResults,
        secondInputs: inputSelectorResultsCopy,
        stack
      }
    );
  }
};

// src/utils.ts
var NOT_FOUND = /* @__PURE__ */ Symbol("NOT_FOUND");
function assertIsFunction(func, errorMessage = `expected a function, instead received ${typeof func}`) {
  if (typeof func !== "function") {
    throw new TypeError(errorMessage);
  }
}
function assertIsObject(object, errorMessage = `expected an object, instead received ${typeof object}`) {
  if (typeof object !== "object") {
    throw new TypeError(errorMessage);
  }
}
function assertIsArrayOfFunctions(array, errorMessage = `expected all items to be functions, instead received the following types: `) {
  if (!array.every((item) => typeof item === "function")) {
    const itemTypes = array.map(
      (item) => typeof item === "function" ? `function ${item.name || "unnamed"}()` : typeof item
    ).join(", ");
    throw new TypeError(`${errorMessage}[${itemTypes}]`);
  }
}
var ensureIsArray = (item) => {
  return Array.isArray(item) ? item : [item];
};
function getDependencies(createSelectorArgs) {
  const dependencies = Array.isArray(createSelectorArgs[0]) ? createSelectorArgs[0] : createSelectorArgs;
  assertIsArrayOfFunctions(
    dependencies,
    `createSelector expects all input-selectors to be functions, but received the following types: `
  );
  return dependencies;
}
function collectInputSelectorResults(dependencies, inputSelectorArgs) {
  const inputSelectorResults = [];
  const { length } = dependencies;
  for (let i = 0; i < length; i++) {
    inputSelectorResults.push(dependencies[i].apply(null, inputSelectorArgs));
  }
  return inputSelectorResults;
}

// src/createSelectorCreator.ts
function createSelectorCreator(memoizeOrOptions, ...memoizeOptionsFromArgs) {
  const createSelectorCreatorOptions = typeof memoizeOrOptions === "function" ? {
    memoize: memoizeOrOptions,
    memoizeOptions: memoizeOptionsFromArgs
  } : memoizeOrOptions;
  const createSelector2 = (...createSelectorArgs) => {
    let recomputations = 0;
    let dependencyRecomputations = 0;
    let lastResult;
    let directlyPassedOptions = {};
    let resultFunc = createSelectorArgs.pop();
    if (typeof resultFunc === "object") {
      directlyPassedOptions = resultFunc;
      resultFunc = createSelectorArgs.pop();
    }
    assertIsFunction(
      resultFunc,
      `createSelector expects an output function after the inputs, but received: [${typeof resultFunc}]`
    );
    const combinedOptions = {
      ...createSelectorCreatorOptions,
      ...directlyPassedOptions
    };
    const {
      memoize,
      memoizeOptions = [],
      argsMemoize = weakMapMemoize,
      argsMemoizeOptions = []
    } = combinedOptions;
    const finalMemoizeOptions = ensureIsArray(memoizeOptions);
    const finalArgsMemoizeOptions = ensureIsArray(argsMemoizeOptions);
    const dependencies = getDependencies(createSelectorArgs);
    const memoizedResultFunc = memoize(function recomputationWrapper() {
      recomputations++;
      return resultFunc.apply(
        null,
        arguments
      );
    }, ...finalMemoizeOptions);
    let firstRun = true;
    const selector = argsMemoize(function dependenciesChecker() {
      dependencyRecomputations++;
      const { length } = dependencies;
      const inputSelectorResults = new Array(length);
      for (let i = 0; i < length; i++) {
        inputSelectorResults[i] = dependencies[i].apply(null, arguments);
      }
      lastResult = memoizedResultFunc.apply(null, inputSelectorResults);
      if (true) {
        const { devModeChecks } = combinedOptions;
        const identityFunctionCheck = devModeChecks !== void 0 && Object.prototype.hasOwnProperty.call(
          devModeChecks,
          "identityFunctionCheck"
        ) ? devModeChecks.identityFunctionCheck : globalDevModeChecks.identityFunctionCheck;
        const inputStabilityCheck = devModeChecks !== void 0 && Object.prototype.hasOwnProperty.call(
          devModeChecks,
          "inputStabilityCheck"
        ) ? devModeChecks.inputStabilityCheck : globalDevModeChecks.inputStabilityCheck;
        if (identityFunctionCheck === "always" || identityFunctionCheck === "once" && firstRun) {
          runIdentityFunctionCheck(
            resultFunc,
            inputSelectorResults,
            lastResult
          );
        }
        if (inputStabilityCheck === "always" || inputStabilityCheck === "once" && firstRun) {
          const inputSelectorResultsCopy = collectInputSelectorResults(
            dependencies,
            arguments
          );
          runInputStabilityCheck(
            { inputSelectorResults, inputSelectorResultsCopy },
            { memoize, memoizeOptions: finalMemoizeOptions },
            arguments
          );
        }
        if (firstRun) firstRun = false;
      }
      return lastResult;
    }, ...finalArgsMemoizeOptions);
    return Object.assign(selector, {
      resultFunc,
      memoizedResultFunc,
      dependencies,
      dependencyRecomputations: () => dependencyRecomputations,
      resetDependencyRecomputations: () => {
        dependencyRecomputations = 0;
      },
      lastResult: () => lastResult,
      recomputations: () => recomputations,
      resetRecomputations: () => {
        recomputations = 0;
      },
      memoize,
      argsMemoize
    });
  };
  Object.assign(createSelector2, {
    withTypes: () => createSelector2
  });
  return createSelector2;
}
var createSelector = /* @__PURE__ */ createSelectorCreator(weakMapMemoize);

// src/createStructuredSelector.ts
var createStructuredSelector = /* @__PURE__ */ Object.assign(
  (inputSelectorsObject, selectorCreator = createSelector) => {
    assertIsObject(
      inputSelectorsObject,
      `createStructuredSelector expects first argument to be an object where each property is a selector, instead received a ${typeof inputSelectorsObject}`
    );
    const inputSelectorKeys = Object.keys(inputSelectorsObject);
    const dependencies = inputSelectorKeys.map(
      (key) => inputSelectorsObject[key]
    );
    const structuredSelector = selectorCreator(
      dependencies,
      (...inputSelectorResults) => {
        return inputSelectorResults.reduce((composition, value, index) => {
          composition[inputSelectorKeys[index]] = value;
          return composition;
        }, {});
      }
    );
    return structuredSelector;
  },
  { withTypes: () => createStructuredSelector }
);

// src/lruMemoize.ts
function createSingletonCache(equals) {
  let entry;
  return {
    get(key) {
      if (entry && equals(entry.key, key)) {
        return entry.value;
      }
      return NOT_FOUND;
    },
    put(key, value) {
      entry = { key, value };
    },
    findMatchingEntry(value, resultEqualityCheck) {
      const current = entry;
      return current !== void 0 && resultEqualityCheck(current.value, value) ? current : void 0;
    },
    clear() {
      entry = void 0;
    }
  };
}
function createLruCache(maxSize, equals) {
  let entries = [];
  function get(key) {
    const cacheIndex = entries.findIndex((entry) => equals(entry.key, key));
    if (cacheIndex > -1) {
      const entry = entries[cacheIndex];
      if (cacheIndex > 0) {
        entries.splice(cacheIndex, 1);
        entries.unshift(entry);
      }
      return entry.value;
    }
    return NOT_FOUND;
  }
  function put(key, value) {
    entries.unshift({ key, value });
    if (entries.length > maxSize) {
      entries.pop();
    }
  }
  function findMatchingEntry(value, resultEqualityCheck) {
    const currentEntries = entries;
    const { length } = currentEntries;
    for (let i = 0; i < length; i++) {
      const entry = currentEntries[i];
      if (resultEqualityCheck(entry.value, value)) {
        return entry;
      }
    }
    return void 0;
  }
  function clear() {
    entries = [];
  }
  return { get, put, findMatchingEntry, clear };
}
var referenceEqualityCheck = (a, b) => a === b;
function createCacheKeyComparator(equalityCheck) {
  return function areArgumentsShallowlyEqual(prev, next) {
    if (prev === null || next === null || prev.length !== next.length) {
      return false;
    }
    const { length } = prev;
    for (let i = 0; i < length; i++) {
      if (!equalityCheck(prev[i], next[i])) {
        return false;
      }
    }
    return true;
  };
}
function lruMemoize(func, equalityCheckOrOptions) {
  const providedOptions = typeof equalityCheckOrOptions === "object" ? equalityCheckOrOptions : { equalityCheck: equalityCheckOrOptions };
  const {
    equalityCheck = referenceEqualityCheck,
    maxSize = 1,
    resultEqualityCheck
  } = providedOptions;
  const comparator = createCacheKeyComparator(equalityCheck);
  let resultsCount = 0;
  const cache = maxSize <= 1 ? createSingletonCache(comparator) : createLruCache(maxSize, comparator);
  function memoized() {
    let value = cache.get(arguments);
    if (value === NOT_FOUND) {
      value = func.apply(null, arguments);
      resultsCount++;
      if (resultEqualityCheck) {
        const matchingEntry = cache.findMatchingEntry(
          value,
          resultEqualityCheck
        );
        if (matchingEntry) {
          value = matchingEntry.value;
          resultsCount !== 0 && resultsCount--;
        }
      }
      cache.put(arguments, value);
    }
    return value;
  }
  memoized.clearCache = () => {
    cache.clear();
    memoized.resetResultsCount();
  };
  memoized.resultsCount = () => resultsCount;
  memoized.resetResultsCount = () => {
    resultsCount = 0;
  };
  return memoized;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createSelector,
  createSelectorCreator,
  createStructuredSelector,
  lruMemoize,
  referenceEqualityCheck,
  setGlobalDevModeChecks,
  weakMapMemoize
});
//# sourceMappingURL=reselect.development.cjs.map