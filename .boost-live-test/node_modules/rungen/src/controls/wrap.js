import is from '../utils/is'

export const call = (value, next, rungen, yieldNext, raiseNext) => {
  if (!is.call(value)) return false
  try {
    next(value.func.apply(value.context, value.args))
  } catch (err) {
    raiseNext(err)
  }
  return true
}

export const cps = (value, next, rungen, yieldNext, raiseNext) => {
  if (!is.cps(value)) return false
  value.func.call(null, ...value.args, (err, result) => {
    if (err) raiseNext(err)
    else next(result)
  })
  return true
}

export default [call, cps]
