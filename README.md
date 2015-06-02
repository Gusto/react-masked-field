# React Masked Input [![Build Status](https://ci.solanolabs.com:443/ZenPayroll/react-masked-input/badges/branches/master?badge_token=794c1568edddf9a8b00392fdc577a476be3f6c10)](https://ci.solanolabs.com:443/ZenPayroll/react-masked-input/suites/195735)

A masked input component built in React.

The `MaskedInput` is a text input field that allows you to restrict and format the values that can be entered into it, while informing the user of the expected input. Common uses include dates, phone numbers, social security numbers and tax IDs.

## Example

```js
var MaskedInput = require('react-masked-input');

function handleComplete(date) {
  console.log('Date is ' + date);
}

React.render(
  <MaskedInput mask="99/99/9999" onComplete={handleComplete} />,
  document.getElementById('demo')
);
```

## Installation

Install from npm:

```
npm install react-masked-input
```

A standalone build is also available in the `dist` folder.

## Props

#### `mask`
string *optional*

The mask applied to the value of the input. For each character of the mask that matches a `translation`, the input character will be restricted to the corresponding regular expression. If no mask is provided, it will function like a normal `input` element.

#### `format`
string *optional*  
default: `'_'`

The placeholder used for characters that haven't yet been filled in (.e.g `MM/DD/YYYY` for a date field). The format string should have a length of 1 or match the length of the mask.

#### `translations`
object *optional*  
default:
```js
{
  '9': /\d/,
  'a': /[A-Za-z]/,
  '*': /[A-Za-z0-9]/
}
```

Additional (or overridden) translations for converting mask characters to regular expressions.

#### `onComplete`
function *optional*

The `onComplete` event is triggered when the mask has been completely filled. The `value` of the input is passed to the event handler.

### Other props
In addition to the props above, `MaskedInput` should handle all supported `input` props.
