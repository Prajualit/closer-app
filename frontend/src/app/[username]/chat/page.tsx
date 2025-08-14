"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/HomePg/Navbar";
import ChatList from "@/components/Chat/ChatList";
import ChatInterface from "@/components/Chat/ChatInterface";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/api";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";

interface Participant {
  _id: string;
  username?: string;
  name: string;
  avatarUrl: string;
}

interface ChatRoom {
  chatId: string;
  isChatbot?: boolean;
  participants: Participant[];
  [key: string]: any;
}

const ChatPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const authenticatedFetch = useAuthenticatedFetch();
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isGoingBack, setIsGoingBack] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const hasProcessedInitialParams = useRef<boolean>(false);

  // Fetch chat rooms on mount
  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const response = await authenticatedFetch(
          API_ENDPOINTS.CHAT_ROOMS
        );
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setChatRooms(data.data);
        }
      } catch (error) {
        console.error("Error fetching chat rooms:", error);
        toast({
          title: "Error",
          description: "Failed to load chat rooms.",
          variant: "destructive",
        });
      } finally {
        // If not initializing from params, finish initialization
        if (isInitializing) {
          setIsInitializing(false);
        }
      }
    };
    fetchChatRooms();
  }, [toast, isInitializing, authenticatedFetch]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle query parameters to automatically open a chat
  useEffect(() => {
    // Skip entirely if user is going back
    if (isGoingBack) {
      console.log("Skipping initialization - user is going back");
      setIsInitializing(false);
      return;
    }

    const initializeChat = async () => {
      const userId = searchParams.get("userId");
      const username = searchParams.get("username");
      const chatId = searchParams.get("chatId");

      console.log("useEffect params:", {
        userId,
        username,
        chatId,
        selectedChat: selectedChat?.chatId,
        isGoingBack,
      });

      // If no parameters at all, just finish initialization
      if (!userId && !username && !chatId) {
        console.log("No parameters - finishing initialization");
        setIsInitializing(false);
        hasProcessedInitialParams.current = false;
        return;
      }

      // Handle opening chat from profile (userId + username) - only once
      if (userId && username && !hasProcessedInitialParams.current) {
        hasProcessedInitialParams.current = true;
        try {
          // Create or get existing chat room with this user
          const response = await authenticatedFetch(
            API_ENDPOINTS.CHAT_ROOM(userId)
          );
          const data = await response.json();

          if (data.success) {
            setSelectedChat(data.data);
            // No need to trigger ChatList refresh since the chat already exists or will be added by startNewChat

            // Update URL to use chatId instead of userId/username for persistence
            // Use direct window.history to prevent navigation effects
            const newUrl = `${window.location.pathname}?chatId=${data.data.chatId}`;
            window.history.replaceState(null, "", newUrl);
          } else {
            toast({
              title: "Error",
              description: `Failed to open chat with ${username}`,
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
            console.error("Error opening chat from profile:", error);
            toast({
              title: "Error",
              description: `Failed to open chat with ${username}`,
              variant: "destructive",
            });
          } else {
            // Fallback for non-object or unknown errors
            console.error("Error opening chat from profile:", error);
            toast({
              title: "Error",
              description: `Failed to open chat with ${username}`,
              variant: "destructive",
            });
          }
        }
      }
      setIsInitializing(false);
    };

    initializeChat();
  }, [searchParams, toast, isGoingBack, selectedChat?.chatId, authenticatedFetch]);

  const handleSelectChat = useCallback(
    (chatRoom: ChatRoom) => {
      // Don't select chat if user is going back
      if (isGoingBack) {
        console.log("Ignoring chat selection - user is going back");
        return;
      }

      console.log("Selecting chat:", chatRoom.chatId);
      setSelectedChat(chatRoom);
      // Update URL to persist the selected chat, but only if it's different
      const currentChatId = searchParams.get("chatId");
      if (currentChatId !== chatRoom.chatId) {
        // Use replace instead of push to avoid navigation history issues
        const newUrl = `${window.location.pathname}?chatId=${chatRoom.chatId}`;
        window.history.replaceState(null, "", newUrl);
      }
    },
    [searchParams, isGoingBack]
  );

  // Function to update chatbot last message in chat list
  const updateChatbotLastMessage = useCallback((message: string) => {
    setChatRooms((prev) =>
      prev.map((room) =>
        room.chatId === "chatbot"
          ? {
              ...room,
              lastMessage: {
                content: message,
                timestamp: new Date().toISOString(),
              },
              lastActivity: new Date().toISOString(),
            }
          : room
      )
    );
  }, []);

  const handleBackToList = useCallback(() => {
    console.log("Going back to chat list");

    // Immediately clear selected chat and set going back flag
    setSelectedChat(null);
    setIsGoingBack(true);

    // Navigate to completely clean URL
    router.replace("/prajualit/chat");

    // Keep the flag set longer to prevent re-initialization
    setTimeout(() => {
      setIsGoingBack(false);
      hasProcessedInitialParams.current = false; // Reset for future navigation
    }, 500);
  }, [router]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Show navbar only on desktop or when no chat is selected on mobile */}
      {(!isMobile || !selectedChat) && <Navbar />}

      {/* Add left margin to account for fixed navbar width on desktop */}
      <div
        className={`transition-all duration-300 ${
          !isMobile
            ? "lg:ml-[15rem] py-6 px-6"
            : selectedChat
              ? "p-0"
              : "py-6 px-6 pt-20 pb-24"
        }`}
      >
        <div
          className={`rounded-lg overflow-hidden ${
            isMobile && selectedChat ? "rounded-none" : ""
          }`}
          style={{
            height:
              isMobile && selectedChat
                ? "100vh"
                : isMobile
                  ? "calc(100vh - 112px)"
                  : "calc(100vh - 48px)",
          }}
        >
          <div className="flex h-full">
            {/* Chat List Sidebar */}
            <div
              className={`${
                isMobile
                  ? selectedChat
                    ? "hidden"
                    : "w-full"
                  : "w-1/3 border-r border-neutral-200 dark:border-neutral-700"
              }`}
            >
              <ChatList
                onSelectChat={handleSelectChat}
                selectedChatId={selectedChat?.chatId}
                refreshTrigger={refreshTrigger}
                autoSelectChatId={(() => {
                  const id = searchParams.get("chatId");
                  return typeof id === "string" ? id : undefined;
                })()}
                chatRooms={chatRooms}
                setChatRooms={setChatRooms}
              />
            </div>

            {/* Chat Interface */}
            <div
              className={`${
                isMobile ? (selectedChat ? "w-full" : "hidden") : "flex-1"
              }`}
            >
              {isInitializing ? (
                <div className="flex items-center justify-center h-full bg-white dark:bg-neutral-900">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-neutral-500 dark:text-neutral-400">
                      Opening chat...
                    </p>
                  </div>
                </div>
              ) : selectedChat ? (
                <ChatInterface
                  chatRoom={{
                    ...selectedChat,
                    participants: selectedChat.participants || [],
                  }}
                  onBack={handleBackToList}
                  onUpdateChatList={updateChatbotLastMessage}
                />
              ) : (
                !isInitializing && (
                  <div className="flex items-center justify-center h-full bg-white dark:bg-neutral-900">
                    <div className="text-center">
                      <div className="text-neutral-400 dark:text-neutral-500 mb-4">
                        <svg
                          className="w-24 h-24 mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-neutral-500 dark:text-neutral-400">
                        Choose from your existing conversations or start a new
                        one
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
