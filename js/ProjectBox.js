'use strict';

import React from 'react';
import ProjectDemo from './ProjectDemo';
import ProjectInstallation from './ProjectInstallation';
import ProjectExample from './ProjectExample';

const TABS = {
  Demo: ProjectDemo,
  Installation: ProjectInstallation,
  Example: ProjectExample,
  Props: 'span'
};

export default React.createClass({
  getInitialState() {
    return { activeTab: Object.keys(TABS)[0] };
  },
  render() {
    let tabs = Object.keys(TABS).map(tabName => {
      return (
        <li key={tabName} className="tab" onClick={() => this.setState({activeTab: tabName})}>
          <a>{tabName}</a>
        </li>
      );
    });

    return (
      <div className="project-box">
        <ul className="nav project-nav">
          {tabs}
        </ul>
        <div className="project-detail">
          {this._renderActiveTab()}
        </div>
      </div>
    );
  },
  _renderActiveTab() {
    let Component = TABS[this.state.activeTab];
    return <Component />;
  }
});
