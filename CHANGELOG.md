## This CHANGELOG is no longer updated

All changes for versions released after July 17, 2020 are listed in the [releases page for this repo](https://github.com/Gusto/react-masked-field/releases). This file is preserved for versions released before July 17. 2020.

## 2.0.3 (Jan 08, 2020)

### Bug Fixes
* Fixes an infinite loop when retroactively adding input

## 2.0.2 (Feb 27, 2019)

### Bug Fixes
* Fix passing a new unmasked `value` prop to the field

### Internal changes
* Tests rewritten using jest

## 2.0.1 (Feb 27, 2019)

### Changes
* Calling onChange will now return an event target that will also include id and name

## 2.0.0 (Feb 27, 2019)

### Breaking changes
* MaskedField is a stateless functional component now, so a `ref` cannot be passed to it. If you need a ref to the `input` node, use the `inputRef` prop.

### New features
* Typescript types now included
* Accept an `inputRef` prop to obtain a ref of the input node

### Internal changes
* Rewritten in Typescript
* Tests rewritten using enzyme


## 1.1.1 (May 25, 2018)

### Changes
* Fix typing when cursor starts at the index a masked character


## 1.1.0 (April 26, 2018)

#### Changes
* Support React v16


## 1.0.1 (April 26, 2017)

#### Changes
* Remove all React 15.4 warnings


## 1.0.0 (April 29, 2016)

#### Changes
* Fix to work with React 15.0


## 0.2.1 (March 7, 2016)

#### First published version


## 0.2.0 (February 25, 2016)

#### Changes
* Remove `dist` files
* Internal changes


## 0.1.4 (August 17, 2015)

#### Bug Fixes
* Don't set the cursor position on componentDidUpdate unless the masked field is focused


## 0.1.3 (July 28, 2015)

#### Bug Fixes
* Only render `input` of type `"text"`


## 0.1.2 (July 22, 2015)

#### Bug Fixes
* Fix typing when the cursor is in the middle of an empty field


## 0.1.1 (July 21, 2015)

#### Bug Fixes
* Fix the case when a mask contains characters that could fit earlier


## 0.1.0 (July 21, 2015)

#### Initial release
