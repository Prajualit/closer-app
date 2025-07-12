import React, { useState, useEffect, useRef } from 'react'
import UserAvatar from '../ui/UserAvatar'
import { ApiError } from '../../../backend/utils/apiError'
import { useRouter } from "next/navigation";
import { useSelector } from 'react-redux';
import Image from 'next/image';
import LoadingButton from '../Loadingbutton';
import { Button } from '../ui/button';
import { useToast } from "@/hooks/use-toast";
import ThemeDropdown from '../ui/ThemeDropdown';

const UserButton = () => {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)
    const { toast } = useToast();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])


    const router = useRouter();
    const handleLogout = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/v1/users/logout`, {
                method: "POST",
                credentials: "include",
            });

            const data = await response.json();
            console.log("Data:", data);

            if (data.success) {
                router.push("/sign-in");
                toast({
                    title: "Logged Out",
                    description: "You have been successfully logged out.",
                    variant: "success",
                });
            } else {
                apiError(401, data.error);
            }
        } catch (error) {
            console.error("Error during logout:", error.message);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            setIsOpen(false);
            return;
        }
        try {
            const response = await fetch(`http://localhost:5000/api/v1/users/delete-account`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await response.json();
            console.log("Data:", data);
            if (data.success) {
                router.push("/sign-in");
                toast({
                    title: "Account Deleted",
                    description: "Your account has been successfully deleted.",
                    variant: "success",
                });
            } else {
                apiError(401, data.error);
            }
        } catch (error) {
            console.error("Error during account deletion:", error.message);
        } finally {
            setIsOpen(false);
        }
    }

    const userDetails = useSelector((state) => state.user.user);
    return (
        <div className="relative" ref={dropdownRef}>
            <div className={`absolute bottom-full left-0 mb-2 z-50 rounded-lg transition-all duration-300 ease-in-out transform ${isOpen
                ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
                }`}>
                <div className="bg-white dark:bg-neutral-900 shadow-lg shadow-neutral-300 dark:shadow-neutral-900 rounded-xl w-80 p-5 flex flex-col justify-between min-h-[350px] border border-neutral-200 dark:border-neutral-700">
                    <div>
                        <div className='flex items-center space-x-3 mt-4'>
                            <div className='flex items-center justify-center rounded-full w-[64px] h-[64px] overflow-hidden relative'>
                                {userDetails && <Image fill className='rounded-full object-cover' src={userDetails.avatarUrl} alt="" />}
                            </div>
                            <div>
                                <h3 className='text-lg font-semibold text-neutral-900 dark:text-white'>{userDetails.name}</h3>
                                <p className='text-sm text-neutral-500 dark:text-neutral-400'>{userDetails.username}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Theme
                            </label>
                            <ThemeDropdown />
                        </div>
                    </div>
                    <div className='flex flex-col space-y-3'>
                        <LoadingButton
                            onClick={handleLogout}
                            className="bg-neutral-900 dark:bg-neutral-700 text-white hover:bg-neutral-800 dark:hover:bg-neutral-600"
                        >
                            Logout
                        </LoadingButton>
                        <Button
                            onClick={handleDeleteAccount}
                            className='w-full py-3 shadow-lg shadow-red-300 dark:shadow-red-900 rounded-[5px] !bg-red-500 text-white hover:!bg-red-600 transition-colors duration-300'>
                            Delete Account
                        </Button>
                    </div>
                </div>
            </div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className='hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-300 rounded-[8px] flex space-x-2 w-full items-center px-4 py-2' >
                <div className='flex items-center justify-center rounded-full w-[32px] h-[32px] overflow-hidden relative'>
                    {userDetails ? <Image fill className='rounded-full object-cover ' src={userDetails.avatarUrl} alt="" /> : <UserAvatar />}
                </div>
                <span className="text-neutral-900 dark:text-white">{userDetails.name.split(" ")[0]}</span>
            </button >
        </div>
    )
}

export default UserButton
