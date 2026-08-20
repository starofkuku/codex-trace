import { useState } from "react";
import { VscCheck, VscCopy } from "react-icons/vsc";
import { copyText } from "../lib/copyText";

interface CopyMessageButtonProps {
  text: string;
  label: string;
}

export function CopyMessageButton({ text, label }: CopyMessageButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const accessibleLabel = copied ? `Copied ${label}` : `Copy ${label}`;

  return (
    <button
      type="button"
      className={`message-copy-button${copied ? " message-copy-button--copied" : ""}`}
      aria-label={accessibleLabel}
      title={accessibleLabel}
      onClick={() => void handleCopy()}
    >
      {copied ? <VscCheck /> : <VscCopy />}
    </button>
  );
}
