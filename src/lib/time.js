export const now = () => new Date().getTime() / 1000.0

export const event = (time, value) => ({ time, value })

export const findPrev = (events, time) => {
  return events
    .filter(e => e.time <= time)
    .sort((a, b) => b.time - a.time)[0] || null
}

export const findNext = (events, time) => {
  return events
    .filter(e => e.time > time)
    .sort((a, b) => a.time - b.time)[0] || null
}

export const sample = (events, time) => {
  const next = findNext(events, time)
  const prev = findPrev(events, time)
  if (!next && !prev) return 0
  if (!next) return prev.value
  if (!prev) return next.value
  let divisor = next.time - prev.time
  if (divisor === 0) divisor = 1
  const param = (time - prev.time) / divisor
  return prev.value + param * (next.value - prev.value)
}

export const schedule = (events, value, delay, time) => {
  time = time || 0
  delay = delay || 0
  const status = event(time, sample(events, time))
  events // delete future events
    .map((e, i) => e.time > time ? i : null)
    .filter(i => i != null)
    .forEach(i => events.splice(i, 1))
  const scheduled = event(time + delay, value)
  events.push(status)
  events.push(scheduled)
  return events
}

export const transition = initial => {
  const events = [event(now(), initial)]
  return {
    events: () => events,
    sample: () => sample(events, now()),
    update: (value, speed) => schedule(events, value, speed, now())
  }
}
