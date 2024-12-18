import React from 'react';

const UpperMenu = ({countDown}) => {
    return(
        <div>
            <div className='counter'>
                {countDown}
            </div>
        <div className='modes'>
                <div className='time-mode'>15s</div>
                <div className='time-mode'>30s</div>
                <div className='time-mode'>60s</div>
            </div>
        </div>
    )
}

export default UpperMenu;