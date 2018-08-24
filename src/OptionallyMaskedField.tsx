/**
 * Copyright (c) 2015 ZenPayroll
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import * as PropTypes from 'prop-types';
import MaskedField, { MaskedFieldProps } from './MaskedField';

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

export interface OptionallyMaskedFieldProps extends Omit<MaskedFieldProps, 'mask'> {
  mask?: string;
}

// TODO:
// - rename this file? (MaskedField and RequiredMaskField)?
// - setup linting

const OptionallyMaskedField: React.SFC<OptionallyMaskedFieldProps> = ({ mask, ...props }) => {
  if (mask) {
    return <MaskedField mask={mask} {...props} />;
  }
  // TODO: Omit unknown props?
  return <input {...props} type="text" />;
};

OptionallyMaskedField.propTypes = {
  mask: PropTypes.string,
};

OptionallyMaskedField.defaultProps = {
  mask: undefined,
};

export default OptionallyMaskedField;
