import { useCallback, useReducer } from 'react';

import sampleActivities from './sampleActivities';

type SetActivitiesJSONAction = {
  payload: { activitiesJSON: string };
  type: 'SET_ACTIVITIES_JSON';
};

type Action = SetActivitiesJSONAction;

type State = {
  activitiesJSON: string;
};

type SetActivitiesJSONCallback = (activitiesJSON: string) => void;

const DEFAULT_STATE: State = {
  activitiesJSON: JSON.stringify(sampleActivities, null, 2)
};

export default function useAppReducer(): readonly [
  State,
  Readonly<{
    setActivitiesJSON: SetActivitiesJSONCallback;
  }>
] {
  const [state, dispatch] = useReducer((state: State, action: Action) => {
    if (action.type === 'SET_ACTIVITIES_JSON') {
      state = { ...state, activitiesJSON: action.payload.activitiesJSON };
    }

    return state;
  }, DEFAULT_STATE);

  const setActivitiesJSON = useCallback<SetActivitiesJSONCallback>(
    activitiesJSON => dispatch({ payload: { activitiesJSON }, type: 'SET_ACTIVITIES_JSON' }),
    [dispatch]
  );

  return Object.freeze([state, Object.freeze({ setActivitiesJSON })] as const);
}
