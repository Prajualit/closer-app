import React, { useState, useEffect, useRef } from "react";
import UserAvatar from "../ui/UserAvatar";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import Image from "next/image";
import LoadingButton from "@/components/LoadingButton";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import ThemeDropdown from "../ui/ThemeDropdown";
import { API_ENDPOINTS } from "@/lib/api";

const UserButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        event.target instanceof Node &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const router = useRouter();
  const handleLogout = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.LOGOUT, {
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
        toast({
          title: "Logout Error",
          description: data.error || "Failed to log out.",
          variant: "destructive",
        });
      }
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        typeof (error as any).name === "string" &&
        (error as any).name !== "AbortError"
      ) {
        console.error("Error during logout:", error);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      setIsOpen(false);
      return;
    }
    try {
      const response = await fetch(API_ENDPOINTS.DELETE_ACCOUNT, {
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
        toast({
          title: "Delete Account Error",
          description: data.error || "Failed to delete account.",
          variant: "destructive",
        });
      }
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        typeof (error as any).name === "string" &&
        (error as any).name !== "AbortError"
      ) {
        console.error("Error during account deletion:", error);
      }
    } finally {
      setIsOpen(false);
    }
  };

  const userDetails = useSelector(
    (state: { user: { user: any } }) => state.user.user
  );
  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`absolute lg:bottom-full lg:left-0 lg:mb-2 top-full right-0 mt-2 lg:mt-0 lg:top-auto lg:right-auto z-50 rounded-lg transition-all duration-300 ease-in-out transform ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-2 pointer-events-none"
        }`}
      >
        <div className="bg-white dark:bg-neutral-900 shadow-lg shadow-neutral-300 dark:shadow-neutral-900 rounded-xl w-72 sm:w-80 p-4 sm:p-5 flex flex-col justify-between min-h-[320px] sm:min-h-[350px] border border-neutral-200 dark:border-neutral-700">
          <div>
            <div className="flex items-center space-x-2 sm:space-x-3 mt-3 sm:mt-4">
              <div className="flex items-center justify-center rounded-full w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] overflow-hidden relative flex-shrink-0">
                {userDetails && userDetails.avatarUrl ? (
                  <Image
                    fill
                    className="rounded-full object-cover"
                    src={userDetails.avatarUrl}
                    alt=""
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 rounded-full">
                    <svg
                      className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-neutral-400 dark:text-neutral-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white truncate">
                  {userDetails.name}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 truncate">
                  @{userDetails.username}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 sm:mb-2">
                Theme
              </label>
              <ThemeDropdown />
            </div>
          </div>
          <div className="flex flex-col space-y-2 sm:space-y-3">
            <LoadingButton
              onClick={handleLogout}
              className="bg-neutral-900 dark:bg-neutral-700 text-white hover:bg-neutral-800 dark:hover:bg-neutral-600 text-sm sm:text-base py-2 sm:py-3"
              pending={false}
            >
              Logout
            </LoadingButton>
            <Button
              onClick={handleDeleteAccount}
              className="w-full py-2 sm:py-3 shadow-lg shadow-red-300 dark:shadow-red-900 rounded-[5px] !bg-red-500 text-white hover:!bg-red-600 transition-colors duration-300 text-sm sm:text-base"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-300 rounded-[8px] flex space-x-2 w-full lg:w-full items-center px-2 sm:px-4 py-2"
      >
        <div className="flex items-center justify-center rounded-full w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] overflow-hidden relative flex-shrink-0">
          {userDetails?.avatarUrl ? (
            <Image
              fill
              className="rounded-full object-cover "
              src={userDetails.avatarUrl}
              alt=""
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 rounded-full">
              <svg
                className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-neutral-400 dark:text-neutral-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}
        </div>
        <span className="text-neutral-900 dark:text-white text-sm sm:text-base hidden lg:inline">
          {userDetails.name.split(" ")[0]}
        </span>
      </button>
    </div>
  );
};

export default UserButton;
