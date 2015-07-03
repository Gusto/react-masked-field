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
    let links = [];
    let tabs = [];

    for (let tabName in TABS) {
      links.push(
        <li key={tabName} className="tab" onClick={() => this.setState({activeTab: tabName})}>
          <a>{tabName}</a>
        </li>
      );

      let TabComponent = TABS[tabName];
      let className = 'project-detail';
      if (tabName !== this.state.activeTab) {
        className += ' hidden';
      }

      tabs.push(
        <div key={tabName} className={className}>
          <TabComponent />
        </div>
      );
    }

    return (
      <div className="project-box">
        <ul className="nav project-nav">
          {links}
        </ul>
        {tabs}
      </div>
    );
  }
});
