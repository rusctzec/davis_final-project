import React from 'react';
import { Redirect } from 'react-router-dom';

export default function Flex(props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: props.col ? 'column' : props.row ? 'row' : '',
      flexWrap: props.wrap ? 'wrap' : props.nowrap ? 'nowrap' : '',
      justifyContent: props.justifyContent,
      alignContent: props.alignContent,
      alignItems: props.alignItems,
      margin: 15,
      ...props.style
    }}>
      {props.children}
    </div>
  );
}