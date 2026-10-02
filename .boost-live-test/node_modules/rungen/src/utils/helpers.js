import keys from './keys'

export const all = value => ({
  type: keys.all,
  value
})

export const error = err => ({
  type: keys.error,
  error: err
})

export const fork = (iterator, ...args) => ({
  type: keys.fork,
  iterator,
  args
})

export const join = task => ({
  type: keys.join,
  task
})

export const race = competitors => ({
  type: keys.race,
  competitors
})

export const delay = timeout => new Promise(resolve => {
  setTimeout(() => resolve(true), timeout)
})

export const invoke = (func, ...args) => ({
  type: keys.call,
  func,
  context: null,
  args
})

export const call = (func, context, ...args) => ({
  type: keys.call,
  func,
  context,
  args
})

export const apply = (func, context, args) => ({
  type: keys.call,
  func,
  context,
  args
})

export const cps = (func, ...args) => ({
  type: keys.cps,
  func,
  args
})

export const subscribe = channel => ({
  type: keys.subscribe,
  channel
})

export const createChannel = callback => {
  const listeners = []
  const subscribe = l => {
    listeners.push(l)
    return () => listeners.splice(listeners.indexOf(l), 1)
  }
  const next = val => listeners.forEach(l => l(val))
  callback(next)

  return {
    subscribe
  }
}
