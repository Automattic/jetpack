import is from '../utils/is'

export const any = (value, next, rungen, yieldNext) => {
  yieldNext(value)
  return true
}

export const error = (value, next, rungen, yieldNext, raiseNext) => {
  if (!is.error(value)) return false
  raiseNext(value.error)
  return true
}

export const object = (value, next, rungen, yieldNext, raiseNext) => {
  if (!is.all(value) || !is.obj(value.value)) return false
  const result = {}
  const keys = Object.keys(value.value)
  let count = 0
  let hasError = false
  const gotResultSuccess = (key, ret) => {
    if (hasError) return
    result[key] = ret
    count++
    if (count === keys.length) {
      yieldNext(result)
    }
  }

  const gotResultError = (key, error) => {
    if (hasError) return
    hasError = true
    raiseNext(error)
  }

  keys.map(key => {
    rungen(
      value.value[key],
      ret => gotResultSuccess(key, ret),
      err => gotResultError(key, err)
    )
  })

  return true
}

export const array = (value, next, rungen, yieldNext, raiseNext) => {
  if (!is.all(value) || !is.array(value.value)) return false
  const result = []
  let count = 0
  let hasError = false
  const gotResultSuccess = (key, ret) => {
    if (hasError) return
    result[key] = ret
    count++
    if (count === value.value.length) {
      yieldNext(result)
    }
  }

  const gotResultError = (key, error) => {
    if (hasError) return
    hasError = true
    raiseNext(error)
  }

  value.value.map((v, key) => {
    rungen(
      v,
      ret => gotResultSuccess(key, ret),
      err => gotResultError(key, err)
    )
  })

  return true
}

export const iterator = (value, next, rungen, yieldNext, raiseNext) => {
  if (!is.iterator(value)) return false
  rungen(value, next, raiseNext)
  return true
}

export default [error, iterator, array, object, any]
