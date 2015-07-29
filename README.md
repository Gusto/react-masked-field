# React Masked Field [![Build Status](https://ci.solanolabs.com:443/ZenPayroll/react-masked-field/badges/branches/master?badge_token=6a04ee4cc963ca172ff97f2dac0723b8d8977f0a)](https://ci.solanolabs.com:443/ZenPayroll/react-masked-field/suites/244347)

A masked field component built in React.

The `MaskedField` component is a text input field that allows you to restrict and format the values that can be entered into it, while informing the user of the expected input. Common uses include dates, phone numbers, social security numbers and tax IDs.

## Example

```js
var MaskedField = require('react-masked-field');

function handleComplete(date) {
  console.log('Date is ' + date);
}

React.render(
  <MaskedField mask="99/99/9999" onComplete={handleComplete} />,
  document.getElementById('demo')
);
```

## Installation

Install from npm:

```
npm install react-masked-field
```

A standalone build is also available in the `dist` folder.

## Props

#### `mask`
**string** *optional*

The mask applied to the value of the field. For each character of the mask that matches a `translation`, the input character will be restricted to the corresponding regular expression. If no mask is provided, it will function like a normal `input` element.

#### `placeholder`
**string** *optional*  
**default:** the value of the `mask` prop

This functions just like a normal `input` `placeholder` prop. If no `placeholder` is provided, the `mask` prop will be used as the `placeholder`.

#### `translations`
**object** *optional*  
**default:**
```js
{
  '9': /\d/,
  'a': /[A-Za-z]/,
  '*': /[A-Za-z0-9]/
}
```

Additional (or overridden) translations for converting mask characters to regular expressions.

#### `onComplete`
**function** *optional*

The `onComplete` event is triggered when the mask has been completely filled. The `value` of the field is passed to the event handler.

### Other props
In addition to the props above, `MaskedField` should handle all supported `input` props.

## License

This project is licensed under the terms of the MIT license
