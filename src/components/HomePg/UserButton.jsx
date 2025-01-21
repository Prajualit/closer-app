import React from 'react'
import UserAvatar from '../ui/UserAvatar'


const UserButton = () => {

    return (
        <button className='hover:bg-neutral-200 transition-colors duration-300 rounded-full p-2'>
            <UserAvatar avatarUrl={user.avatarUrl} />
        </button>
    )
}

export default UserButton
