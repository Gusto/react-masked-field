/**
 * Copyright (c) 2015 ZenPayroll
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import AlwaysMaskedField, { AlwaysMaskedFieldProps } from './AlwaysMaskedField';

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

export interface MaskedFieldProps extends Omit<AlwaysMaskedFieldProps, 'mask'> {
  mask?: string;
}

const MaskedField: React.SFC<MaskedFieldProps> = ({ mask, ...props }) => {
  if (mask) {
    return <AlwaysMaskedField mask={mask} {...props} />;
  }
  const { translations, onComplete, valueLink, ...inputProps } = props;
  return <input {...inputProps} type="text" />;
};

MaskedField.propTypes = {
  mask: PropTypes.string,
};

MaskedField.defaultProps = {
  mask: undefined,
};

export default MaskedField;
