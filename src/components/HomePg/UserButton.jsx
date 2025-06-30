import React, { useState, useEffect, useRef } from 'react'
import UserAvatar from '../ui/UserAvatar'
import { apiError } from '../../../backend/utils/apiError'
import { useRouter } from "next/navigation";
import { useSelector } from 'react-redux';
import Image from 'next/image';
import LoadingButton from '../Loadingbutton';
import { Button } from '../ui/button';
import { useToast } from "@/hooks/use-toast";

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
                <div className="bg-neutral-50 shadow-lg shadow-[#adadad] rounded-xl w-80 p-5 flex flex-col justify-between min-h-[300px]">
                    <div>
                        <div className='flex items-center space-x-3 mt-4'>
                            <div className='flex items-center justify-center rounded-full w-[64px] h-[64px] overflow-hidden'>
                                {userDetails && <Image width={64} height={64} className='rounded-full object-cover bg-center' src={userDetails.avatarUrl} alt="" />}
                            </div>
                            <div>
                                <h3 className='text-lg font-semibold'>{userDetails.name}</h3>
                                <p className='text-sm text-neutral-500'>{userDetails.username}</p>
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-col space-y-3'>
                        <LoadingButton
                            onClick={handleLogout}
                        >
                            Logout
                        </LoadingButton>
                        <Button
                            onClick={handleDeleteAccount}
                            className='w-full py-3 shadow-lg shadow-[#adadad] rounded-[5px] !bg-red-500 text-white hover:!bg-red-600 transition-colors duration-300'>
                            Delete Account
                        </Button>
                    </div>
                </div>
            </div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className='hover:bg-[#efefef] transition-colors duration-300 rounded-[8px] flex space-x-2 w-full items-center px-4 py-2' >
                <div className='flex items-center justify-center rounded-full w-[32px] h-[32px] overflow-hidden'>
                    {userDetails ? <Image width={32} height={32} className='rounded-full object-cover bg-center ' src={userDetails.avatarUrl} alt="" /> : <UserAvatar />}
                </div>
                <span>{userDetails.name.split(" ")[0]}</span>
            </button >
        </div>
    )
}

export default UserButton
