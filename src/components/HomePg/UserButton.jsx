import React from 'react'
import UserAvatar from '../ui/UserAvatar'

const UserButton = (userData) => {

    return (
        <button className='hover:bg-neutral-200 transition-colors duration-300 rounded-full flex space-x-2 items-center p-2'>
            <UserAvatar avatarUrl={userData.userData.avatarUrl} />
            <span>{userData.userData.name}</span>
        </button>
    )
}

export default UserButton
