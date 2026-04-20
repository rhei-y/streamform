import { test, assert, assertEqual, assertThrows, reset, report } from './runner.js';
import { Event } from '../js/core/Event.js';
import { Gate } from '../js/core/Gate.js';
import { Stream } from '../js/core/Stream.js';
import { StreamLog } from '../js/core/StreamLog.js';

// -- Event --

test('Event: type and data', () => {
  const e = new Event('foo', { x: 1 });
  assertEqual(e.type, 'foo');
  assertEqual(e.data.x, 1);
});

test('Event: data defaults to empty object', () => {
  const e = new Event('bar');
  assertEqual(e.type, 'bar');
  assert(typeof e.data === 'object');
  assertEqual(Object.keys(e.data).length, 0);
});

// -- Gate --

test('Gate: signature stored', () => {
  const g = new Gate('test_sig');
  assertEqual(g.signature, 'test_sig');
});

test('Gate: transform is a no-op by default', () => {
  const g = new Gate('noop');
  g.transform(new Event('noop'), {});
});

// -- Stream: registration --

test('Stream: register and lookup', () => {
  const s = new Stream();
  const g = new Gate('x');
  s.register(g);
  assert(s.gates.has('x'));
});

test('Stream: signature collision throws', () => {
  const s = new Stream();
  s.register(new Gate('x'));
  assertThrows(() => s.register(new Gate('x')), 'Signature collision');
});

test('Stream: different signatures coexist', () => {
  const s = new Stream();
  s.register(new Gate('a'));
  s.register(new Gate('b'));
  assertEqual(s.gates.size, 2);
});

// -- Stream: emit and pending --

test('Stream: unclaimed event goes to pending', () => {
  const s = new Stream();
  s.emit(new Event('unknown', { v: 42 }));
  const sample = s.sampleHere();
  assertEqual(sample.pending.length, 1);
  assertEqual(sample.pending[0].type, 'unknown');
  assertEqual(sample.pending[0].data.v, 42);
});

test('Stream: claimed event does not go to pending', () => {
  class Sink extends Gate {
    constructor() { super('sink'); }
    transform() {}
  }
  const s = new Stream();
  s.register(new Sink());
  s.emit(new Event('sink', {}));
  assertEqual(s.sampleHere().pending.length, 0);
});

test('Stream: gate transform receives event and stream', () => {
  let received = null;
  class Spy extends Gate {
    constructor() { super('spy'); }
    transform(event, stream) {
      received = { type: event.type, data: event.data, hasEmit: typeof stream.emit === 'function' };
    }
  }
  const s = new Stream();
  s.register(new Spy());
  s.emit(new Event('spy', { val: 99 }));
  assertEqual(received.type, 'spy');
  assertEqual(received.data.val, 99);
  assert(received.hasEmit);
});

test('Stream: gate can emit into same stream', () => {
  class Doubler extends Gate {
    constructor() { super('double'); }
    transform(event, stream) {
      stream.emit(new Event('result', { value: event.data.x * 2 }));
    }
  }
  const s = new Stream();
  s.register(new Doubler());
  s.emit(new Event('double', { x: 5 }));
  const sample = s.sampleHere();
  assertEqual(sample.pending.length, 1);
  assertEqual(sample.pending[0].data.value, 10);
});

test('Stream: depth-first processing', () => {
  const order = [];
  class A extends Gate {
    constructor() { super('a'); }
    transform(event, stream) {
      order.push('a-start');
      stream.emit(new Event('b', {}));
      order.push('a-end');
    }
  }
  class B extends Gate {
    constructor() { super('b'); }
    transform() { order.push('b'); }
  }
  const s = new Stream();
  s.register(new A());
  s.register(new B());
  s.emit(new Event('a', {}));
  assertEqual(order.join(','), 'a-start,b,a-end');
});

// -- Stream: sampleHere --

test('Stream: sampleHere returns copy of pending', () => {
  const s = new Stream();
  s.emit(new Event('x', {}));
  const sample = s.sampleHere();
  sample.pending.pop();
  assertEqual(s.sampleHere().pending.length, 1, 'original not affected');
});

test('Stream: eventCount tracks all emits', () => {
  class Echo extends Gate {
    constructor() { super('echo'); }
    transform(event, stream) {
      stream.emit(new Event('out', {}));
    }
  }
  const s = new Stream();
  s.register(new Echo());
  s.emit(new Event('echo', {}));
  assertEqual(s.sampleHere().eventCount, 2);
});

test('Stream: gateCount in sampleHere', () => {
  const s = new Stream();
  s.register(new Gate('a'));
  s.register(new Gate('b'));
  s.register(new Gate('c'));
  assertEqual(s.sampleHere().gateCount, 3);
});

test('Stream: pending accumulates across emits', () => {
  const s = new Stream();
  s.emit(new Event('x', {}));
  s.emit(new Event('y', {}));
  assertEqual(s.sampleHere().pending.length, 2);
});

// -- Stream: constructor options --

test('Stream: no-arg constructor still works', () => {
  const s = new Stream();
  assertEqual(s.log, null);
  assertEqual(s.streamId, null);
  assertEqual(s.parentStreamId, null);
});

test('Stream: constructor accepts log', () => {
  const fakeLog = { nextStreamId: () => 42 };
  const s = new Stream({ log: fakeLog });
  assertEqual(s.log, fakeLog);
  assertEqual(s.streamId, 42);
});

// -- StreamLog: levels --

test('StreamLog: OFF records nothing', () => {
  const log = new StreamLog('OFF');
  log.record({ streamId: 1, eventType: 'x', gateClaimed: 'x', eventData: {} });
  assertEqual(log.sample().count, 0);
});

test('StreamLog: EVENTS records type and claimed', () => {
  const log = new StreamLog('EVENTS');
  log.record({ streamId: 1, eventType: 'foo', gateClaimed: 'foo', eventData: { big: true } });
  const entries = log.sample().entries;
  assertEqual(entries.length, 1);
  assertEqual(entries[0].type, 'foo');
  assertEqual(entries[0].claimed, 'foo');
  assert(entries[0].streamId === undefined, 'no streamId at EVENTS');
  assert(entries[0].data === undefined, 'no data at EVENTS');
});

test('StreamLog: EVENTS records null claimed for pending', () => {
  const log = new StreamLog('EVENTS');
  log.record({ streamId: 1, eventType: 'orphan', gateClaimed: null, eventData: {} });
  assertEqual(log.sample().entries[0].claimed, null);
});

test('StreamLog: DEEP includes streamId and parentStreamId', () => {
  const log = new StreamLog('DEEP');
  log.record({ streamId: 5, parentStreamId: 3, eventType: 'x', gateClaimed: 'x', eventData: {} });
  const e = log.sample().entries[0];
  assertEqual(e.streamId, 5);
  assertEqual(e.parentStreamId, 3);
  assert(e.data === undefined, 'no data at DEEP');
});

test('StreamLog: DEEP omits parentStreamId when null', () => {
  const log = new StreamLog('DEEP');
  log.record({ streamId: 1, parentStreamId: null, eventType: 'x', gateClaimed: null, eventData: {} });
  assert(!('parentStreamId' in log.sample().entries[0]));
});

test('StreamLog: DATA includes everything', () => {
  const log = new StreamLog('DATA');
  log.record({ streamId: 2, parentStreamId: 1, eventType: 'y', gateClaimed: 'y', eventData: { val: 42 } });
  const e = log.sample().entries[0];
  assertEqual(e.streamId, 2);
  assertEqual(e.parentStreamId, 1);
  assertEqual(e.data.val, 42);
});

// -- StreamLog: sequencing --

test('StreamLog: seq increments', () => {
  const log = new StreamLog('EVENTS');
  log.record({ streamId: 1, eventType: 'a', gateClaimed: null, eventData: {} });
  log.record({ streamId: 1, eventType: 'b', gateClaimed: null, eventData: {} });
  log.record({ streamId: 1, eventType: 'c', gateClaimed: null, eventData: {} });
  const entries = log.sample().entries;
  assertEqual(entries[0].seq, 0);
  assertEqual(entries[1].seq, 1);
  assertEqual(entries[2].seq, 2);
});

test('StreamLog: entries have timestamps', () => {
  const log = new StreamLog('EVENTS');
  const before = Date.now();
  log.record({ streamId: 1, eventType: 'x', gateClaimed: null, eventData: {} });
  const after = Date.now();
  const time = log.sample().entries[0].time;
  assert(time >= before && time <= after);
});

// -- StreamLog: IDs --

test('StreamLog: nextStreamId increments', () => {
  const log = new StreamLog('EVENTS');
  const a = log.nextStreamId();
  const b = log.nextStreamId();
  assertEqual(b, a + 1);
});

// -- StreamLog: sample and clear --

test('StreamLog: sample returns copy', () => {
  const log = new StreamLog('EVENTS');
  log.record({ streamId: 1, eventType: 'x', gateClaimed: null, eventData: {} });
  const s = log.sample();
  s.entries.pop();
  assertEqual(log.sample().count, 1);
});

test('StreamLog: clear resets entries and seq', () => {
  const log = new StreamLog('EVENTS');
  log.record({ streamId: 1, eventType: 'x', gateClaimed: null, eventData: {} });
  log.record({ streamId: 1, eventType: 'y', gateClaimed: null, eventData: {} });
  log.clear();
  assertEqual(log.sample().count, 0);
  log.record({ streamId: 1, eventType: 'z', gateClaimed: null, eventData: {} });
  assertEqual(log.sample().entries[0].seq, 0, 'seq resets');
});

// -- StreamLog: runtime level change --

test('StreamLog: level change takes effect immediately', () => {
  const log = new StreamLog('OFF');
  log.record({ streamId: 1, eventType: 'a', gateClaimed: null, eventData: {} });
  assertEqual(log.sample().count, 0);

  log.level = 'EVENTS';
  log.record({ streamId: 1, eventType: 'b', gateClaimed: null, eventData: {} });
  assertEqual(log.sample().count, 1);

  log.level = 'OFF';
  log.record({ streamId: 1, eventType: 'c', gateClaimed: null, eventData: {} });
  assertEqual(log.sample().count, 1);
});

test('StreamLog: upgrade level mid-run adds detail', () => {
  const log = new StreamLog('EVENTS');
  log.record({ streamId: 1, eventType: 'a', gateClaimed: null, eventData: { x: 1 } });

  log.level = 'DATA';
  log.record({ streamId: 1, eventType: 'b', gateClaimed: null, eventData: { x: 2 } });

  const entries = log.sample().entries;
  assert(entries[0].data === undefined, 'first entry has no data');
  assertEqual(entries[1].data.x, 2, 'second entry has data');
});

// -- Integration: Stream + StreamLog --

test('StreamLog: Stream.emit records to log', () => {
  const log = new StreamLog('EVENTS');
  class Sink extends Gate {
    constructor() { super('sink'); }
    transform() {}
  }
  const s = new Stream({ log });
  s.register(new Sink());
  s.emit(new Event('sink', {}));
  s.emit(new Event('orphan', {}));

  const entries = log.sample().entries;
  assertEqual(entries.length, 2);
  assertEqual(entries[0].claimed, 'sink');
  assertEqual(entries[1].claimed, null);
});

test('StreamLog: shared log across parent and sub-stream', () => {
  const log = new StreamLog('DEEP');
  class Spawner extends Gate {
    constructor() { super('spawn'); }
    transform(event, stream) {
      const sub = new Stream({ log, parentStreamId: stream.streamId });
      sub.emit(new Event('child_event', {}));
    }
  }
  const parent = new Stream({ log });
  parent.register(new Spawner());
  parent.emit(new Event('spawn', {}));

  const entries = log.sample().entries;
  assertEqual(entries.length, 2);
  assertEqual(entries[0].streamId, parent.streamId);
  assertEqual(entries[1].parentStreamId, parent.streamId);
});

// -- Barrel export --

test('Barrel export: all four classes accessible', async () => {
  const barrel = await import('../js/core/index.js');
  assert(typeof barrel.Event === 'function', 'Event exported');
  assert(typeof barrel.Gate === 'function', 'Gate exported');
  assert(typeof barrel.Stream === 'function', 'Stream exported');
  assert(typeof barrel.StreamLog === 'function', 'StreamLog exported');
});

// -- Browser adaptation verification --

test('Browser core: zero divergence from CORE contracts', () => {
  // Event contract
  const e = new Event('t', { k: 1 });
  assert(e.type === 't' && e.data.k === 1, 'Event contract intact');

  // Gate contract
  const g = new Gate('sig');
  assert(g.signature === 'sig', 'Gate signature intact');
  assert(typeof g.transform === 'function', 'Gate transform exists');

  // Stream contract
  const s = new Stream();
  assert(typeof s.register === 'function', 'Stream.register exists');
  assert(typeof s.emit === 'function', 'Stream.emit exists');
  assert(typeof s.sampleHere === 'function', 'Stream.sampleHere exists');
  assert(Array.isArray(s.pending), 'Stream.pending is array');
  assert(s.gates instanceof Map, 'Stream.gates is Map');

  // StreamLog contract
  const log = new StreamLog('EVENTS');
  assert(typeof log.record === 'function', 'StreamLog.record exists');
  assert(typeof log.sample === 'function', 'StreamLog.sample exists');
  assert(typeof log.clear === 'function', 'StreamLog.clear exists');
  assert(typeof log.nextStreamId === 'function', 'StreamLog.nextStreamId exists');
  assert(Array.isArray(log.entries), 'StreamLog.entries is array');
});

const exitCode = report('siso-demo core');
process.exit(exitCode);
