'use strict';

import React from 'react';
import ProjectBox from './ProjectBox';
import ProjectDemo from './ProjectDemo';
import ProjectInstallation from './ProjectInstallation';
import ProjectExample from './ProjectExample';
import ProjectProps from './ProjectProps';

export default React.createClass({
  render() {
    return (
      <div className="row">
        <div className="col-sm-10 col-sm-offset-1">
          <div className="project-description">
            <h3>About React-Masked-Field</h3>
            <p>
              The MaskedField component is a text input field that allows you to restrict and format
              the values that can be entered into it, while informing the user of the expected
              input. Common uses include dates, phone numbers, social security numbers and tax IDs.
            </p>
          </div>
          <ProjectBox defaultTab="Demo">
            <ProjectDemo tab="Demo" />
            <ProjectInstallation tab="Installation" />
            <ProjectExample tab="Example" />
            <ProjectProps tab="Props" />
          </ProjectBox>
        </div>
      </div>
    );
  }
});
