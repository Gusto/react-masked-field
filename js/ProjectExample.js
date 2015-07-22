'use strict';

import React from 'react';
import hljs from 'highlight.js';

const EXAMPLE_CODE =
`var MaskedField = require('react-masked-field');

function handleComplete(date) {
  console.log('Date is ' + date);
}

React.render(
  <MaskedField mask="99/99/9999" onComplete={handleComplete} />,
  document.getElementById('demo')
);`;

export default React.createClass({
  // render() {
  //   return (
  //     <div>
  //       <h4>Example</h4>
  //       <p>
  //         <code>
  //           <span className="variable">var </span>
  //           MaskedField =
  //           <span className="method"> require</span>
  //           ('react-masked-field');
  //         </code>
  //       </p>
  //       <p>
  //         <code>
  //           <span className="variable">function </span>
  //           handleComplete(date) {'{'}
  //           <br/>
  //           <span className="method">&nbsp; console.log</span>
  //           ('Date is ' + date);
  //           <br/>
  //           {'}'}
  //         </code>
  //       </p>
  //       <p>
  //         <code>
  //           React.render(
  //           <br/>
  //           &nbsp; &lt;MaskedField mask="99/99/9999" {'onComplete={handleComplete}'} /&gt;,
  //           <br/>
  //           <span className="method">&nbsp; document.getElementById</span>
  //           ('demo')
  //           <br/>
  //           );
  //         </code>
  //       </p>
  //     </div>
  //   );
  // }
  componentDidMount() {
    this._highlightCode();
  },
  componentDidUpdate() {
    this._highlightCode();
  },
  render() {
    return (
      <div>
        <h4>Example</h4>
        <pre><code className="javascript">{EXAMPLE_CODE}</code></pre>
      </div>
    );
  },
  _highlightCode: function () {
    hljs.highlightBlock(React.findDOMNode(this).querySelector('code'));
  }
});
