import React from "react";

const defaultAvatar = () => {
  return (
    <div className="w-fit h-fit flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 rounded-full">
      <svg
        className="w-12 h-12 text-neutral-400 dark:text-neutral-500"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
};

export default defaultAvatar;
