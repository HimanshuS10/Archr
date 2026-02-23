import React from 'react'

type TasksProp = {
    isExpanded: boolean;
};


const Tasks = ({ isExpanded }: TasksProp) => {
    return (
        <div className={`h-screen overflow-hidden px-8 pt-2 pb-3 transition-[margin] duration-300 ${isExpanded ? 'ml-[260px]' : 'ml-[70px]'}`}>
            <h1>This is the events tab</h1>
        </div>
    )
}

export default Tasks