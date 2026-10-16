import {lazy, Suspense, useState} from 'react';
import type {CodeEditorProps} from './CodeEditorImpl';
const Editor = lazy(() => import('./CodeEditorImpl').then((m) => ({default: m.CodeEditor})));
export function CodeEditor(props: CodeEditorProps) {
  // Capture the navigation's focus before the editor module starts loading.
  const [initialFocusOrigin] = useState(() => document.activeElement);
  return (
    <Suspense fallback={<div role="status">Editor wird geladen …</div>}>
      <Editor {...props} initialFocusOrigin={initialFocusOrigin} />
    </Suspense>
  );
}
