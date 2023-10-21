import './App.css';

import { memo, useMemo } from 'react';

import ActivityInput from './ActivityInput';
import onErrorResumeNext from '../util/onErrorResumeNext';
import useAppReducer from '../data/useAppReducer';
import WebChat from './WebChat';

export default memo(function App() {
  const [{ activitiesJSON }, { setActivitiesJSON }] = useAppReducer();
  const activities = useMemo(() => onErrorResumeNext(() => JSON.parse(activitiesJSON)), [activitiesJSON]);

  return (
    <div className="app">
      <div className="app__pane">
        <ActivityInput onChange={setActivitiesJSON} value={activitiesJSON} />
      </div>
      <div className="app__pane">
        <WebChat activities={activities} key={activitiesJSON} />
      </div>
    </div>
  );
});
