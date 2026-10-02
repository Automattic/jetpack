// packages/compose/src/higher-order/pipe.ts
var basePipe = (reverse = false) => (...funcs) => (...args) => {
  const functions = funcs.flat();
  if (reverse) {
    functions.reverse();
  }
  return functions.reduce(
    (prev, func) => [func(...prev)],
    args
  )[0];
};
var pipe = basePipe();
var pipe_default = pipe;
export {
  basePipe,
  pipe_default as default
};
//# sourceMappingURL=pipe.mjs.map
