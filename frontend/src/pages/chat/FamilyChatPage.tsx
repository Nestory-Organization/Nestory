import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, MessageCircle, Send, Users } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import chatService from '../../services/chatService';
import { ChatGroupSummary, ChatMessage } from '../../types';

const formatTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const FamilyChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [group, setGroup] = useState<ChatGroupSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<any>(null);
  const joinedRef = useRef(false);

  const myRole = user?.role || 'parent';

  const load = async () => {
    setLoading(true);
    try {
      const [groupData, rows] = await Promise.all([
        chatService.getMyGroup(),
        chatService.getMessages(80),
      ]);
      setGroup(groupData);
      setMessages(rows);
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message ===
          'string'
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to load chat';
      toast.error(message || 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const unreadFromOthers = useMemo(
    () =>
      messages
        .filter((m) => (m.senderRole || '').toLowerCase() !== myRole)
        .map((m) => m.id),
    [messages, myRole]
  );

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Memoize handlers to ensure stable references for socket listeners
  const handleIncoming = useCallback((payload: { message?: ChatMessage }) => {
    console.log("[Chat] EVENT: chat:new-message received:", payload);
    if (!payload?.message) {
      console.warn("[Chat] Received message event with no message data");
      return;
    }
    
    const msg = payload.message;
    console.log("[Chat] Message details:", { id: msg.id, sender: msg.senderName, type: msg.messageType });
    
    setMessages((prev) => {
      const exists = prev.some((item) => item.id === msg.id);
      if (exists) {
        console.log("[Chat] Message already exists, skipping");
        return prev;
      }
      console.log("[Chat] Adding message, new count:", prev.length + 1);
      return [...prev, msg];
    });
  }, []);

  const handleTyping = useCallback((payload: { name?: string; userId?: string; isTyping?: boolean }) => {
    console.log("[Chat] Typing event received:", payload);
    if (!payload?.name) return;
    
    setTypingUsers((prev) => {
      if (payload.isTyping) {
        return prev.includes(payload.name as string) ? prev : [...prev, payload.name as string];
      }
      return prev.filter((name) => name !== payload.name);
    });
  }, []);

  const handleRead = useCallback((payload: any) => {
    console.log("[Chat] Read receipt event:", payload);
  }, []);

  const joinRoom = useCallback(async (socket: any) => {
    if (joinedRef.current) {
      console.log("[Chat] Already joined room, skipping");
      return;
    }

    console.log("[Chat] Attempting to join room");
    return new Promise((resolve) => {
      socket.emit('chat:join', {}, (ack: { ok: boolean; message?: string; room?: string }) => {
        if (!ack?.ok) {
          console.error("[Chat] Failed to join room:", ack?.message);
          toast.error(ack?.message || "Failed to join chat room");
          resolve(false);
        } else {
          console.log("[Chat] Successfully joined room:", ack?.room);
          joinedRef.current = true;
          resolve(true);
        }
      });
    });
  }, []);

  // Set up socket connection and listeners ONCE on mount
  useEffect(() => {
    if (!token) {
      console.log("[Chat] No token, skipping socket setup");
      return;
    }

    console.log("[Chat] Initializing socket connection");
    const socket = chatService.connectSocket(token);
    socketRef.current = socket;

    // Define event handlers
    const onConnect = () => {
      console.log("[Chat] Socket CONNECTED:", socket.id);
      if (!socketRef.current) return;
      
      // Immediately try to join the room after connecting
      console.log("[Chat] Emitting chat:join");
      socketRef.current.emit('chat:join', {}, (ack: any) => {
        if (!ack?.ok) {
          console.error("[Chat] Join failed:", ack?.message);
          toast.error(ack?.message || "Failed to join chat room");
        } else {
          console.log("[Chat] Joined room successfully:", ack?.room);
          joinedRef.current = true;
        }
      });
    };

    const onConnectError = (error: any) => {
      console.error("[Chat] CONNECT_ERROR:", error);
    };

    const onDisconnect = (reason: string) => {
      console.log("[Chat] Socket DISCONNECTED:", reason);
      joinedRef.current = false;
    };

    // Attach listeners
    console.log("[Chat] Attaching socket event listeners");
    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.on("chat:new-message", handleIncoming);
    socket.on("chat:typing", handleTyping);
    socket.on("chat:read", handleRead);

    // If socket is already connected, manually trigger join
    if (socket.connected) {
      console.log("[Chat] Socket already connected, triggering join");
      onConnect();
    }

    // Cleanup ONLY on unmount
    return () => {
      console.log("[Chat] UNMOUNTING - removing listeners");
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.off("chat:new-message", handleIncoming);
      socket.off("chat:typing", handleTyping);
      socket.off("chat:read", handleRead);
      // Don't call disconnect - let chatService manage it
    };
  }, [token]); // Only re-run when token changes

  useEffect(() => {
    if (!unreadFromOthers.length) return;
    chatService.markRead(unreadFromOthers).catch(() => {});
  }, [unreadFromOthers]);

  const notifyTyping = useCallback(() => {
    if (!token || !socketRef.current) {
      console.log("[Chat] Cannot send typing - token or socket unavailable");
      return;
    }
    
    const socket = socketRef.current;
    console.log("[Chat] Sending typing indicator to socket");
    socket.emit('chat:typing', { isTyping: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      console.log("[Chat] Sending typing stopped");
      socket.emit('chat:typing', { isTyping: false });
    }, 1200);
  }, [token]);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content) return;

    try {
      setSending(true);
      console.log("[Chat] Sending message via REST API:", content);
      const created = await chatService.sendMessage(content);
      console.log("[Chat] Message sent successfully:", created.id);
      setMessages((prev) => {
        const exists = prev.some((msg) => msg.id === created.id);
        if (exists) return prev;
        return [...prev, created];
      });
      setNewMessage('');
    } catch (error: unknown) {
      console.error("[Chat] Send message error:", error);
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message ===
          'string'
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to send message';
      toast.error(message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Family Chat" />

      <div className="container-responsive py-8 max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(user?.role === 'child' ? '/child' : '/dashboard')}
          className="btn-secondary mb-4 inline-flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="card mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle size={24} className="text-nestory-600" />
              {group?.name || 'Family Chat'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Chat with your family and get reading activity updates.
            </p>
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Users size={16} />
            <span>{group?.members?.length || 0} members</span>
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="h-[60vh] overflow-y-auto p-4 bg-gradient-to-b from-white to-gray-50">
            {loading ? (
              <p className="text-gray-600">Loading chat...</p>
            ) : messages.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <MessageCircle className="mx-auto mb-3 text-gray-400" size={28} />
                <p>No messages yet. Start the conversation.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const isMine = message.senderUser === user?.id;
                  const isSystem = message.senderRole === 'system';

                  if (isSystem) {
                    return (
                      <div key={message.id} className="text-center">
                        <span className="inline-block rounded-full bg-nestory-100 px-3 py-1 text-xs text-nestory-700">
                          {message.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${
                          isMine
                            ? 'bg-nestory-600 text-white rounded-br-md'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        {!isMine && (
                          <p className="text-xs font-semibold text-nestory-700 mb-1">
                            {message.senderName}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        <p className={`text-[11px] mt-1 ${isMine ? 'text-nestory-100' : 'text-gray-500'}`}>
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 p-3 bg-white">
            {typingUsers.length > 0 && (
              <p className="text-xs text-gray-500 mb-2">{typingUsers.join(', ')} typing...</p>
            )}
            <div className="flex gap-2">
              <input
                value={newMessage}
                onChange={(event) => {
                  setNewMessage(event.target.value);
                  notifyTyping();
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nestory-500"
                placeholder="Type a message..."
                maxLength={1500}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
                className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
              >
                <Send size={16} />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyChatPage;
