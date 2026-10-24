import {describe, expect, it, vi} from 'vitest';
import type {WorkspaceViewState} from '../../src/domain/model';
import {checkedId} from '../../src/domain/workspace';
import {defaultView, type ViewRepository} from '../../src/infrastructure/storage/viewState';
import {WorkspaceViewController} from '../../src/state/workspaceView';

const workspaceId = checkedId<'workspace'>('c363b0ca-ff4d-4c52-a0ee-6c0b5468e257');
const analysisId = checkedId<'analysis'>('4015ca68-c487-44b2-a1cb-090893d94bd5');

describe('Workspace view initialization', () => {
  it('joins repeated initialization and never reloads over local navigation or sidebar changes', async () => {
    let resolveLoad: (value: WorkspaceViewState) => void = () => {};
    const deferred = new Promise<WorkspaceViewState>((resolve) => {
      resolveLoad = resolve;
    });
    let stored = defaultView(workspaceId);
    const load = vi
      .fn<ViewRepository['load']>()
      .mockReturnValueOnce(deferred)
      .mockImplementation(async () => structuredClone(stored));
    const repository: ViewRepository = {
      load,
      save: vi.fn(async (value: WorkspaceViewState) => {
        stored = structuredClone(value);
      }),
    };
    const onError = vi.fn();
    const view = new WorkspaceViewController(repository, workspaceId, onError);

    const initial = view.load();
    expect(view.load()).toBe(initial);
    expect(load).toHaveBeenCalledTimes(1);
    expect(view.store.getState().ready).toBe(false);
    resolveLoad(defaultView(workspaceId));
    await initial;
    view.patch({activeAnalysisId: analysisId, openAnalysisIds: [analysisId]});
    view.patch({sidebarCollapsed: false});
    expect(view.load()).toBe(initial);
    await view.load();
    await view.flush();

    expect(load).toHaveBeenCalledTimes(1);
    expect(view.store.getState()).toMatchObject({
      ready: true,
      value: {activeAnalysisId: analysisId, openAnalysisIds: [analysisId], sidebarCollapsed: false},
    });
    expect(onError).not.toHaveBeenCalled();

    const reopened = new WorkspaceViewController(repository, workspaceId, onError);
    await reopened.load();
    expect(load).toHaveBeenCalledTimes(2);
    expect(reopened.store.getState().value).toEqual(view.store.getState().value);
  });

  it('reports a failed initial load once and keeps usable defaults and later local edits', async () => {
    const failure = new Error('View preferences unavailable');
    const load = vi.fn<ViewRepository['load']>().mockRejectedValue(failure);
    const repository: ViewRepository = {load, save: vi.fn(async () => {})};
    const onError = vi.fn();
    const view = new WorkspaceViewController(repository, workspaceId, onError);

    await Promise.all([view.load(), view.load()]);
    expect(onError).toHaveBeenCalledExactlyOnceWith(failure);
    expect(view.store.getState()).toEqual({value: defaultView(workspaceId), ready: true});
    view.patch({sidebarCollapsed: false});
    await view.load();
    await view.flush();
    expect(load).toHaveBeenCalledTimes(1);
    expect(view.store.getState().value.sidebarCollapsed).toBe(false);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
