'use strict';

import React from 'react';

export default React.createClass({
  render() {
    return (
      <div>
        <h4>Example</h4>
        <p>
          <code>
            <span className="variable">var </span>
            MaskedField =
            <span className="method"> require</span>
            ('react-masked-field');
          </code>
        </p>
        <p>
          <code>
            <span className="variable">function </span>
            handleComplete(date) {'{'}
            <br/>
            <span className="method">&nbsp; console.log</span>
            ('Date is ' + date);
            <br/>
            {'}'}
          </code>
        </p>
        <p>
          <code>
            React.render(
            <br/>
            &nbsp; &lt;MaskedField mask="99/99/9999" {'onComplete={handleComplete}'} /&gt;,
            <br/>
            <span className="method">&nbsp; document.getElementById</span>
            ('demo')
            <br/>
            );
          </code>
        </p>
      </div>
    );
  }
});
