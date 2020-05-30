import React, { useRef, useEffect, useContext, createContext } from "react";


const InputContext = createContext();

const InputProvider = (props) => {


  let inputRef = useRef({
    keys:{}
  });

  // connect input event listeners to inputRef when component mounts
  useEffect(() => {
    document.addEventListener("keydown", e => {
      inputRef.current.keys[e.code] = true;
    });

    document.addEventListener("keyup", e => {
      inputRef.current.keys[e.code] = false;
    });
  }, [])

  return (
    <InputContext.Provider value={inputRef} {...props}/>
  );
}

const useInputContext = () => {
  return useContext(InputContext);
}

export {InputProvider, useInputContext}