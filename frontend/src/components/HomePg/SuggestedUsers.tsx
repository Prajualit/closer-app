"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS, makeAuthenticatedRequest } from "@/lib/api";
import { useSelector } from "react-redux";
import LoadingButton from "@/components/LoadingButton";
import SuggestedUsersModal from "../Modal/suggestedUsers.modal";

interface SuggestedUser {
  _id: string;
  avatarUrl?: string;
  name: string;
  username: string;
  followersCount?: number;
  isFollowed: boolean;
}

const SuggestedUsers = () => {
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentUser = useSelector(
    (state: { user: { user: any } }) => state.user.user
  );
  const router = useRouter();

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        // Fetch more users for the modal (increased limit)
        const response = await makeAuthenticatedRequest(
          `${API_ENDPOINTS.SUGGESTED_USERS}?limit=20`,
          { method: "GET" }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Suggested users response:", data); // Debug log
          if (data.success && data.data.users) {
            console.log("Setting suggested users:", data.data.users); // Debug log
            setSuggestedUsers(
              data.data.users.map((user: any) => ({
                ...user,
                isFollowed:
                  typeof user.isFollowed === "boolean"
                    ? user.isFollowed
                    : false,
              }))
            );
          } else {
            console.log("No users in response or unsuccessful:", data);
          }
        } else {
          console.error(
            "API response not ok:",
            response.status,
            response.statusText
          );
        }
      } catch (error) {
        console.error("Error fetching suggested users:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && currentUser !== "home") {
      fetchSuggestedUsers();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleFollow = async (userId: string) => {
    try {
      const response = await makeAuthenticatedRequest(API_ENDPOINTS.FOLLOW, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        console.log("Successfully followed user:", userId); // Debug log
        // Update the user's following status instead of removing them
        setSuggestedUsers((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, isFollowed: true } : user
          )
        );
      } else {
        console.error("Failed to follow user:", response.status);
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const handleProfileClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  return (
    <div className="w-full">
      <div className="">
        {loading ? (
          <div className="text-center py-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Loading suggestions...
            </p>
          </div>
        ) : suggestedUsers.length === 0 ? (
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No suggestions available.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop View - Vertical List */}
            <div className="hidden lg:block space-y-2 bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 px-2 pt-2">
                Suggested Users
              </h3>
              {suggestedUsers
                .slice(0, 3)
                .filter((user) => !user.isFollowed)
                .map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-700 py-2 px-3 rounded-[8px] transition-all duration-300 cursor-pointer"
                  >
                    <div
                      className="flex items-center space-x-3 flex-1 cursor-pointer rounded-lg p-2 transition-colors"
                      onClick={() => handleProfileClick(user._id)}
                    >
                      {user.avatarUrl ? (
                        <div className="relative w-10 h-10">
                          <Image
                            src={user.avatarUrl || "/default-avatar.svg"}
                            alt={user.name}
                            fill
                            className="rounded-full object-cover"
                          />
                        </div>
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
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                          {user.username}
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {user.followersCount || 0} followers
                        </p>
                      </div>
                    </div>
                    <LoadingButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollow(user._id);
                      }}
                      className="px-3 !text-sm font-medium !w-fit !h-fit transition-colors"
                      pending={loading}
                    >
                      {user.isFollowed ? "Followed" : "Follow"}
                    </LoadingButton>
                  </div>
                ))}

              {/* Show More Button - Only on Desktop */}
              {suggestedUsers.filter((user) => !user.isFollowed).length > 3 && (
                <div className="text-center mt-4">
                  <LoadingButton
                    onClick={() => setIsModalOpen(true)}
                    className="!bg-white dark:!bg-neutral-700 hover:!bg-neutral-50 dark:hover:!bg-neutral-600 !text-black dark:!text-white !text-sm w-full"
                    pending={false}
                  >
                    Show More
                  </LoadingButton>
                </div>
              )}
            </div>

            {/* Mobile View - Improved Grid Layout */}
            <div className="lg:hidden">
              <div className="grid grid-cols-2 gap-4">
                {suggestedUsers
                  .filter((user) => !user.isFollowed)
                  .slice(0, 2)
                  .map((user) => (
                    <div
                      key={user._id}
                      className="flex flex-col items-center space-y-3 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    >
                      {user.avatarUrl ? (
                        <div
                          className="relative w-16 h-16 sm:w-20 sm:h-20 cursor-pointer"
                          onClick={() => handleProfileClick(user._id)}
                        >
                          <Image
                            src={user.avatarUrl || "/default-avatar.svg"}
                            alt={user.name}
                            fill
                            className="rounded-full object-cover border-2 border-white dark:border-neutral-600 shadow-sm"
                          />
                        </div>
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
                      <div className="text-center w-full">
                        <h4 className="text-sm font-medium text-neutral-900 dark:text-white truncate mb-1">
                          {user.username}
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                          {user.followersCount || 0} followers
                        </p>
                        <LoadingButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollow(user._id);
                          }}
                          className="w-full px-3 py-1.5 text-xs font-medium transition-colors"
                          pending={loading}
                        >
                          {user.isFollowed ? "Followed" : "Follow"}
                        </LoadingButton>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Show More Button for Mobile */}
              {suggestedUsers.filter((user) => !user.isFollowed).length > 2 && (
                <div className="text-center mt-4">
                  <LoadingButton
                    onClick={() => setIsModalOpen(true)}
                    className="!bg-neutral-100 dark:!bg-neutral-700 hover:!bg-neutral-200 dark:hover:!bg-neutral-600 !text-black dark:!text-white w-full"
                    pending={false}
                  >
                    Show All Suggestions
                  </LoadingButton>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <SuggestedUsersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        suggestedUsers={suggestedUsers}
        onFollow={handleFollow}
      />
    </div>
  );
};

export default SuggestedUsers;
