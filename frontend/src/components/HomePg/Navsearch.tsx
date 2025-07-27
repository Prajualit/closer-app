
"use client";

interface UserSearchResult {
  _id: string;
  avatarUrl: string;
  name: string;
  username: string;
}

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
// @ts-ignore
import search from "@/assets/search.png";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/api";

const Navsearch = () => {
  const [query, setQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        event.target instanceof Node &&
        !searchRef.current.contains(event.target)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          API_ENDPOINTS.USER_SEARCH(encodeURIComponent(query)),
          {
            credentials: "include",
          }
        );
        const data = await response.json();

        if (data.success) {
          setSearchResults(data.data || []);
          setShowResults(true);
        } else {
          setSearchResults([]);
          setShowResults(false);
        }
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "name" in error &&
          typeof (error as any).name === "string" &&
          (error as any).name !== "AbortError"
        ) {
          console.error("Search error:", error);
        }
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleUserClick = (user: UserSearchResult) => {
    setQuery("");
    setShowResults(false);
    router.push(`/profile/${user._id}`);
  };

  return (
    <div ref={searchRef} className="relative w-full mx-auto max-lg:mt-3">
      <div className="transition-all duration-300 hover:shadow-lg focus-within:shadow-lg flex items-center rounded-[8px] px-3 py-2 bg-white dark:bg-neutral-800 space-x-2 shadow-md border border-neutral-200 dark:border-neutral-700">
        <Image src={search} alt="Search" />
        <input
          placeholder="Search for users..."
          className="bg-transparent outline-none w-full text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setShowResults(true)}
        />
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map(
              (user: UserSearchResult): React.ReactElement => (
                <div
                  key={user._id}
                  className="flex items-center space-x-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer border-b dark:border-neutral-600 last:border-b-0"
                  onClick={() => handleUserClick(user)}
                >
                  {user.avatarUrl ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src={user.avatarUrl}
                        alt={user.name}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
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
                  <div className="flex-1">
                    <div className="font-medium dark:text-white">
                      {user.name}
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                      @{user.username}
                    </div>
                  </div>
                </div>
              )
            )
          ) : (
            <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
              No users found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Navsearch;
