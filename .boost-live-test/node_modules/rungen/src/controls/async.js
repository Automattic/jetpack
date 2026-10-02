import is from '../utils/is'
import {error} from '../utils/helpers'
import createDispatcher from '../utils/dispatcher'

export const promise = (value, next, rungen, yieldNext, raiseNext) => {
  if (!is.promise(value)) return false
  value.then(next, raiseNext)
  return true
}

const forkedTasks = new Map()
export const fork = (value, next, rungen) => {
  if (!is.fork(value)) return false
  const task = Symbol('fork')
  const dispatcher = createDispatcher()
  forkedTasks.set(task, dispatcher)
  rungen(
    value.iterator.apply(null, value.args),
    result => dispatcher.dispatch(result),
    err => dispatcher.dispatch(error(err))
  )
  const unsubscribe = dispatcher.subscribe(() => {
    unsubscribe()
    forkedTasks.delete(task)
  })
  next(task)
  return true
}

export const join = (value, next, rungen, yieldNext, raiseNext) => {
  if (!is.join(value)) return false
  const dispatcher = forkedTasks.get(value.task)
  if (!dispatcher) {
    raiseNext('join error : task not found')
  } else {
    const unsubscribe = dispatcher.subscribe(result => {
      unsubscribe()
      next(result)
    })
  }
  return true
}

export const race = (value, next, rungen, yieldNext, raiseNext) => {
  if (!is.race(value)) return false
  let finished = false
  const success = (result, k, v) => {
    if (finished) return
    finished = true
    result[k] = v
    next(result)
  }

  const fail = err => {
    if (finished) return
    raiseNext(err)
  }
  if (is.array(value.competitors)) {
    const result = value.competitors.map(() => false)
    value.competitors.forEach((competitor, index) => {
      rungen(competitor, output => success(result, index, output), fail)
    })
  }
  else {
    const result = Object.keys(value.competitors).reduce((p, c) => {
      p[c] = false
      return p
    }, {})
    Object.keys(value.competitors).forEach(index => {
      rungen(value.competitors[index], output => success(result, index, output), fail)
    })
  }
  return true
}

const subscribe = (value, next) => {
  if (!is.subscribe(value)) return false
  if (!is.channel(value.channel)) {
    throw new Error('the first argument of "subscribe" must be a valid channel')
  }
  const unsubscribe = value.channel.subscribe(ret => {
    unsubscribe && unsubscribe()
    next(ret)
  })

  return true
}

export default [promise, fork, join, race, subscribe]
