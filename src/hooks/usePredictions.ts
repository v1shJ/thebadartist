import { useEffect, useRef, useState } from 'react';

import { getClassifier } from '@/ml';
import type { Prediction, Stroke } from '@/types/drawing';

export type PredictionStatus = 'idle' | 'loading' | 'ready' | 'error';

export type PredictionState = {
  status: PredictionStatus;
  predictions: Prediction[];
};

const EMPTY: PredictionState = { status: 'idle', predictions: [] };

export function usePredictions(strokes: Stroke[], delayMs = 450): PredictionState {
  const [state, setState] = useState<PredictionState>(EMPTY);
  const generation = useRef(0);

  useEffect(() => {
    const run = generation.current + 1;
    generation.current = run;

    if (strokes.length === 0) {
      const reset = setTimeout(() => {
        if (generation.current === run) setState(EMPTY);
      }, 0);
      return () => clearTimeout(reset);
    }

    const timer = setTimeout(() => {
      if (generation.current !== run) return;
      setState((previous) => ({ ...previous, status: 'loading' }));

      getClassifier()
        .then((classifier) => classifier.predict({ strokes }))
        .then((predictions) => {
          if (generation.current === run) setState({ status: 'ready', predictions });
        })
        .catch(() => {
          if (generation.current === run) setState({ status: 'error', predictions: [] });
        });
    }, delayMs);

    return () => clearTimeout(timer);
  }, [strokes, delayMs]);

  return state;
}
