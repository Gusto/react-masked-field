'use strict';

import React from 'react';
import hljs from 'highlight.js';
import PropDoc from './PropDoc';

export default React.createClass({
  render() {
    const defaultTranslations = hljs.highlight('javascript',
    `{
      '9': /\d/,
      'a': /[A-Za-z]/,
      '*': /[A-Za-z0-9]/
    }`).value;

    return (
      <div>
        <h4>Props</h4>
        <PropDoc name="mask" type="string" optional={true}>
          The mask applied to the value of the field. For each character of the mask that
          matches a translation, the input character will be restricted to the corresponding
          regular expression. If no mask is provided, it will function like a normal input
          element.
        </PropDoc>
        <PropDoc
          name="placeholder"
          type="string"
          optional={true}
          defaultVal="the value of the mask prop"
        >
          This functions just like a normal input placeholder prop. If no placeholder is provided,
          the mask prop will be used as the placeholder.
        </PropDoc>
        <PropDoc name="translations" type="object" optional={true} defaultVal={defaultTranslations}>
          Additional (or overridden) translations for converting mask characters to regular
          expressions.
        </PropDoc>
        <PropDoc name="onComplete" type="function" optional={true}>
          The onComplete event is triggered when the mask has been completely filled. The value of
          the field is passed to the event handler.
        </PropDoc>
      </div>
    );
  }
});
