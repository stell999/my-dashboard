'use client';
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ChatWidget({ deviceId, currentUser }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (deviceId && open) fetchMessages();
  }, [deviceId, open]);

  useEffect(() => {
    if (!open) return;

    const channel = supabase
      .channel('device_notes_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'device_notes',
        filter: `device_id=eq.${deviceId}`,
      }, () => {
        fetchMessages(); // تحديث مباشر عند إرسال رسالة جديدة
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId, open]);

  async function fetchMessages() {
    if (!deviceId) return;

    const { data, error } = await supabase
      .from("device_notes")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("خطأ في جلب الرسائل:", error);
      setMessages([]);
      setUnreadCount(0);
    } else {
      setMessages(data || []);

      const unreadMessages = (data || []).filter(
        (msg) =>
          msg.sender !== currentUser &&
          (!msg.read_by || !msg.read_by.includes(currentUser))
      );
      setUnreadCount(unreadMessages.length);

      scrollToBottom();
      markMessagesAsRead(data);
    }
  }

  async function markMessagesAsRead(fetchedMessages) {
    const unreadMessages = fetchedMessages.filter(
      (msg) =>
        msg.sender !== currentUser &&
        (!msg.read_by || !msg.read_by.includes(currentUser))
    );

    for (const msg of unreadMessages) {
      const newReadBy = msg.read_by ? [...msg.read_by, currentUser] : [currentUser];
      await supabase
        .from("device_notes")
        .update({ read_by: newReadBy })
        .eq("id", msg.id);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;

    const { error } = await supabase.from("device_notes").insert([
      {
        device_id: deviceId,
        sender: currentUser,
        message: newMessage.trim(),
        read_by: [currentUser],
      },
    ]);
    if (error) {
      alert("حدث خطأ أثناء إرسال الرسالة");
      return;
    }
    setNewMessage("");
    fetchMessages();
  }

  function scrollToBottom() {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  return (
    <div className="max-w-xl mx-auto my-4">
      <button
        onClick={() => setOpen(!open)}
        className="relative bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition"
      >
        {open ? "إغلاق الشات" : "فتح الشات"}
        {unreadCount > 0 && !open && (
          <span className="absolute -top-1 -right-2 inline-block w-5 h-5 text-xs font-bold bg-red-600 text-white rounded-full text-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="border rounded p-3 bg-white shadow mt-2 max-h-80 overflow-y-auto"
          style={{ maxHeight: "320px" }}
        >
          <div className="mb-2 font-bold text-right flex items-center justify-end gap-2">
            محادثة الجهاز #{deviceId}
          </div>
          <div className="space-y-2 overflow-y-auto max-h-60">
            {messages.length === 0 && (
              <div className="text-center text-gray-500">لا توجد رسائل بعد</div>
            )}
            {messages.map((msg) => {
              const isCurrentUser = msg.sender === currentUser;
              const isUnread =
                !isCurrentUser &&
                (!msg.read_by || !msg.read_by.includes(currentUser));

              return (
                <div
                  key={msg.id}
                  className={`relative p-2 rounded ${
                    isCurrentUser ? "bg-blue-200 text-right" : "bg-gray-200 text-left"
                  }`}
                >
                  <div className="text-xs text-gray-600">{msg.sender}</div>
                  <div className="flex items-center gap-2">
                    <span>{msg.message}</span>
                    {isUnread && <span className="w-2 h-2 rounded-full bg-red-500" />}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleString()}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-2 flex gap-2">
            <input
              type="text"
              placeholder="اكتب رسالة..."
              className="flex-grow border rounded p-2"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white px-4 rounded"
            >
              إرسال
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
