'use strict';

import React from 'react';
import cx from 'classnames';

export default React.createClass({
  propTypes: {
    defaultTab: React.PropTypes.string.isRequired,
    children: React.PropTypes.node
  },
  getInitialState() {
    return { activeTab: this.props.defaultTab };
  },
  render() {
    let links = [];
    let tabs = [];

    React.Children.forEach(this.props.children, child => {
      let tabName = child.props.tab;

      links.push(
        <li key={tabName} className="tab" onClick={() => this.setState({activeTab: tabName})}>
          <a>{tabName}</a>
        </li>
      );

      let className = cx('project-detail', { 'hidden': (tabName !== this.state.activeTab) });
      tabs.push(
        <div key={tabName} className={className}>
          {child}
        </div>
      );
    });

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
