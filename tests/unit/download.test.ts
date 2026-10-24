// @vitest-environment jsdom
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {downloadStream} from '../../src/app/download';

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:download-test'),
    revokeObjectURL: vi.fn(),
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it('cancels the pending source read and never starts a stale download', async () => {
  const cancelled = vi.fn();
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  const stream = new ReadableStream<Uint8Array>({cancel: cancelled});
  const controller = new AbortController();
  const exporting = downloadStream(stream, 'result.xlsx', 'application/test', controller.signal);
  const rejected = expect(exporting).rejects.toMatchObject({name: 'AbortError'});
  controller.abort();
  await rejected;
  expect(cancelled).toHaveBeenCalledOnce();
  expect(click).not.toHaveBeenCalled();
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  expect(stream.locked).toBe(false);
});

it('keeps the MIME type, sanitizes the filename and releases the successful object URL', async () => {
  let filename = '';
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    filename = this.download;
  });
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array([80, 75, 3, 4]));
      controller.close();
    },
  });
  await downloadStream(stream, '../Resultat / 2026.xlsx', 'application/test');
  expect(filename).toBe('.._Resultat___2026.xlsx');
  expect(URL.createObjectURL).toHaveBeenCalledWith(
    expect.objectContaining({type: 'application/test'}),
  );
  expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  vi.advanceTimersByTime(60000);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:download-test');
  expect(stream.locked).toBe(false);
});
