import { expect } from 'chai'
import { describe, it } from 'mocha'
import { event, sample, findNext, findPrev, schedule } from './../src/lib/time'

describe('findPrev', () => {
  it('returns null if timeline is empty', () => {
    expect(findPrev([], 0)).to.eql(null)
  })
  it('returns null if there are no previous events', () => {
    expect(findPrev([event(1, 11)], 0)).to.eql(null)
  })
  it('returns single previous event', () => {
    expect(findPrev([event(-1, 11), event(1, 12)], 0)).to.eql(event(-1, 11))
  })
  it('returns latest event from multiple', () => {
    expect(findPrev([event(-2, 12), event(-1, 11)], 0)).to.eql(event(-1, 11))
  })
})

describe('findNext', () => {
  it('returns null if timeline is empty', () => {
    expect(findNext([], 0)).to.eql(null)
  })
  it('returns null if there are no future events', () => {
    expect(findNext([event(-1, 11)], 0)).to.eql(null)
  })
  it('returns single future event', () => {
    expect(findNext([event(-1, 11), event(1, 12)], 0)).to.eql(event(1, 12))
  })
  it('returns earliest event from multiple', () => {
    expect(findNext([event(1, 12), event(2, 11)], 0)).to.eql(event(1, 12))
  })
})

describe('sample', () => {
  it('returns zero if there are no events', () => {
    expect(sample([], 0)).to.eql(0)
  })
  it('takes last when sampling after events', () => {
    expect(sample([event(0, 1)], 1)).to.eql(1)
  })
  it('takes first when sampling before events', () => {
    expect(sample([event(1, 1)], 0)).to.eql(1)
  })
  it('takes latest when multiple past events', () => {
    expect(sample([event(1, 12), event(2, 13), event(0, 11)], 3)).to.eql(13)
  })
  it('takes soonest when multiple future events', () => {
    expect(sample([event(1, 12), event(0, 11), event(2, 13)], -1)).to.eql(11)
  })
  it('interpolates between events', () => {
    expect(sample([event(0, 1), event(1, 2)], 0.5)).to.eql(1.5)
  })
})

describe('schedule', () => {
  it('adds scheduled event', () => {
    expect(schedule([], 11, 2, 1))
      .to.eql([event(1, 0), event(3, 11)])
  })
  it('adds status event', () => {
    expect(schedule([event(0, 1)], 11, 2, 1))
      .to.eql([event(0, 1), event(1, 1), event(3, 11)])
  })
  it('interpolates status event', () => {
    expect(schedule([event(0, 0), event(2, 2)], 11, 2, 1))
      .to.eql([event(0, 0), event(1, 1), event(3, 11)])
  })
  it('clears future events', () => {
    expect(schedule([event(0, 5), event(2, 7)], 11, 2, 1))
      .to.eql([event(0, 5), event(1, 6), event(3, 11)])
  })
})
