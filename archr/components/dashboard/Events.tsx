import React from 'react'

type EventsProp = {
  isExpanded: boolean;
};

const Events = ({isExpanded} : EventsProp) => {
  return (
    <div className={`h-screen overflow-hidden px-8 pt-2 pb-3 transition-[margin] duration-300 ${isExpanded ? 'ml-[260px]' : 'ml-[70px]'}`}>
        <h1>This is the events tab</h1>
    </div>
  )
}

export default Events