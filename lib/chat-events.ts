// Tiny shared store so the header bell can show unread support replies from the chat widget.
export type ChatUnread = { count: number; latest: string };

let current: ChatUnread = { count: 0, latest: "" };

export const getChatUnread = () => current;

export function setChatUnread(next: ChatUnread) {
  if (next.count === current.count && next.latest === current.latest) return;
  current = next;
  window.dispatchEvent(new CustomEvent<ChatUnread>("chat-unread", { detail: next }));
}
