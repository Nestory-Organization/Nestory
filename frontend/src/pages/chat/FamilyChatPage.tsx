import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, MessageCircle, Send, Users, Trash2 } from 'lucide-react';
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
  const [clearing, setClearing] = useState(false);
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

  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear all chat messages? This action cannot be undone.')) {
      return;
    }

    try {
      setClearing(true);
      await chatService.clearChat();
      setMessages([]);
      toast.success('Chat cleared successfully');
    } catch (error: unknown) {
      console.error("[Chat] Clear chat error:", error);
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message ===
          'string'
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to clear chat';
      toast.error(message || 'Failed to clear chat');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Family Chat" />

      <div className="container-responsive py-8 max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(user?.role === 'child' ? '/child' : '/dashboard')}
          className="btn-secondary mb-6 inline-flex items-center gap-2 transition-all hover:drop-shadow-md"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="card mb-6 flex items-center justify-between gap-4 bg-gradient-to-r from-white to-nestory-50/30 border-nestory-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <MessageCircle size={24} className="text-white" />
              </div>
              {group?.name || 'Family Chat'}
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Chat with your family and get reading activity updates.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{group?.members?.length || 0}</div>
              <div className="text-xs text-gray-600 flex items-center gap-1 justify-end mt-1">
                <Users size={14} />
                <span>{group?.members?.length === 1 ? 'member' : 'members'}</span>
              </div>
            </div>
            {myRole === 'parent' && (
              <button
                type="button"
                onClick={handleClearChat}
                disabled={clearing || messages.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                title="Clear all chat messages"
              >
                <Trash2 size={18} />
                <span className="text-sm">Clear Chat</span>
              </button>
            )}
          </div>
        </div>

        <div className="card p-0 overflow-hidden border-nestory-200 shadow-lg">
          <div className="h-[60vh] overflow-y-auto p-5 bg-gradient-to-b from-white via-white to-gray-50/30">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin"></div>
                  <p className="text-gray-600 font-medium">Loading chat...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-20 text-gray-600 h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-nestory-100 flex items-center justify-center mb-4">
                  <MessageCircle className="text-nestory-400" size={32} />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">No messages yet</p>
                <p className="text-sm">Start the conversation with your family!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isMine = message.senderUser === user?.id;
                  const isSystem = message.senderRole === 'system';

                  if (isSystem) {
                    return (
                      <div key={message.id} className="flex justify-center my-2">
                        <span className="inline-block rounded-full bg-gradient-to-r from-nestory-50 to-blue-50 border border-nestory-200 px-4 py-2 text-xs font-medium text-nestory-700 shadow-sm">
                          {message.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-md transition-all duration-200 hover:shadow-lg ${
                          isMine
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm hover:border-gray-300'
                        }`}
                      >
                        {!isMine && (
                          <p className="text-xs font-bold text-nestory-700 mb-2 uppercase tracking-wide">
                            {message.senderName}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                        <p className={`text-[11px] mt-2 font-medium ${
                          isMine ? 'text-blue-100 opacity-80' : 'text-gray-500'
                        }`}>
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

          <div className="border-t border-gray-200 p-4 bg-gradient-to-b from-white to-gray-50 space-y-3">
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-nestory-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-nestory-500 animate-bounce" style={{ animationDelay: '100ms' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-nestory-500 animate-bounce" style={{ animationDelay: '200ms' }}></div>
                </div>
                <span className="text-xs text-gray-600 font-medium">{typingUsers.join(', ')} typing...</span>
              </div>
            )}
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
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
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-0 focus:border-nestory-500 transition-colors duration-200 placeholder-gray-400"
                  placeholder="Type a message..."
                  maxLength={1500}
                />
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:-translate-y-0"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyChatPage;
