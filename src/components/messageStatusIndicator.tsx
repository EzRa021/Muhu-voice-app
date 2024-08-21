import React from "react";
import { CheckIcon, ClockIcon } from "@radix-ui/react-icons";

type MessageStatusIndicatorProps = {
  status: "sending" | "sent" | "delivered" | "failed" | "offline";
};

const MessageStatusIndicator: React.FC<MessageStatusIndicatorProps> = ({ status }) => {
  if (status === "sending" || status === "offline") {
    return <ClockIcon className="text-gray-500" />; // Gray clock for sending or offline
  } else if (status === "sent") {
    return <CheckIcon className="text-blue-500" />; // Blue checkmark for sent
  } else if (status === "delivered") {
    return <CheckIcon className="text-green-500" />; // Green checkmark for delivered
  } else if (status === "failed") {
    return <CheckIcon className="text-red-500" />; // Red checkmark for failed
  }
  return null;
};

export default MessageStatusIndicator;
