import { useState, useEffect, useRef } from "react";
import { Search, Send, Phone, Video, Plus, MessageSquare as MessageSquareIcon, Clock } from "lucide-react";
import axios from "axios";
import "./styles/MessagePharmacie.css"; // Assuming shared styles for messages

// Utility function to get initials for avatars
const getInitials = (name) => {
  if (!name) return '';
  const parts = name.split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const MessagePatient = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]); // Messages for the actively selected conversation
  const [newMessageBody, setNewMessageBody] = useState(""); // Input field for new message
  const [searchTerm, setSearchTerm] = useState(""); // Search term for conversations
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableChatUsers, setAvailableChatUsers] = useState([]); // Users to start a new chat with
  const [loadingAvailableUsers, setLoadingAvailableUsers] = useState(true);
  const [newChatSearchTerm, setNewChatSearchTerm] = useState(""); // Search term for new chat users
  const messagesEndRef = useRef(null);

  // Scroll to the bottom of the messages list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper to get auth token
  const getToken = () => localStorage.getItem("token");

  // Generic API request handler (adapted from MessagePharmacie)
  const apiCall = async (method, url, data = null) => {
    try {
      const token = getToken();
      if (!token) {
        setError("Authentification requise. Veuillez vous reconnecter.");
        return Promise.reject(new Error("No token found"));
      }
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      let response;
      if (method === "get") {
        response = await axios.get(url, config);
      } else if (method === "post") {
        response = await axios.post(url, data, config);
      }
      setError(null);
      return response.data;
    } catch (err) {
      console.error(`API Error (${method} ${url}):`, err);
      setError(err.response?.data?.message || "Une erreur est survenue.");
      return Promise.reject(err);
    }
  };

  // Fetch conversations for the doctor
  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const data = await apiCall("get", "http://localhost:8000/api/messages/conversations");
      setConversations(data);
    } catch (err) {
      // Error already handled in apiCall
    } finally {
      setLoadingConversations(false);
    }
  };

  // Fetch messages for a selected conversation
  const fetchMessages = async (conversationUuid) => {
    setLoadingMessages(true);
    setMessages([]);
    try {
      const data = await apiCall("get", `http://localhost:8000/api/messages/conversation/${conversationUuid}`);
      setMessages(data.messages);
      setSelectedConversation({
        id: conversationUuid,
        uuid: conversationUuid,
        user: data.otherUser,
      });
    } catch (err) {
      // Error already handled in apiCall
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send a new message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageBody.trim() || !selectedConversation) return;

    const currentConversationUuid = selectedConversation.uuid;
    const messageToSend = newMessageBody;
    setNewMessageBody("");

    // Add message temporarily to UI
    const tempMessage = {
      id: Date.now(),
      text: messageToSend,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      sender: "you",
      isSending: true,
    };
    setMessages((prevMessages) => [...prevMessages, tempMessage]);

    try {
      const data = await apiCall("post", `http://localhost:8000/api/messages/conversation/${currentConversationUuid}/send`, { 
        body: messageToSend 
      });

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === tempMessage.id ? { ...msg, id: data.id, isSending: false } : msg
        )
      );
      fetchConversations();
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Échec de l'envoi du message.");
      setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== tempMessage.id));
      setNewMessageBody(messageToSend);
    }
  };

  // Fetch users for new chat modal
  const fetchAvailableChatUsers = async () => {
    setLoadingAvailableUsers(true);
    try {
      const data = await apiCall("get", "http://localhost:8000/api/messages/available-chat-users");
      setAvailableChatUsers(data);
    } catch (err) {
      // Error already handled in apiCall
    } finally {
      setLoadingAvailableUsers(false);
    }
  };

  // Start a new conversation with a selected user
  const handleStartNewConversation = async (receiverId) => {
    try {
      const data = await apiCall("post", "http://localhost:8000/api/messages/start-conversation", { 
        receiver_id: receiverId 
      });
      setShowNewChatModal(false);
      setNewChatSearchTerm("");
      fetchConversations();
      fetchMessages(data.conversation_uuid);
    } catch (err) {
      setError("Impossible de démarrer la conversation.");
    }
  };

  // Effect to load conversations on component mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Effect to scroll to bottom when messages or selected conversation change
  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedConversation]);

  // Handle conversation selection
  const handleSelectConversation = (conversation) => {
    // Mark messages as read
    if (conversation.unreadCount > 0) {
      setConversations(
        conversations.map((conv) =>
          conv.id === conversation.id
            ? { ...conv, unreadCount: 0, lastMessage: { ...conv.lastMessage, isRead: true } }
            : conv,
        ),
      );
    }
    fetchMessages(conversation.id);
  };

  // Format message time
  const formatMessageTime = (time) => {
    return time;
  };

  // Filtered conversations based on search term
  const filteredConversations = conversations.filter((conv) =>
    conv.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtered available users for new chat based on search term
  const filteredAvailableUsers = availableChatUsers.filter((user) =>
    user.name.toLowerCase().includes(newChatSearchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(newChatSearchTerm.toLowerCase())
  );

  return (
        <div className="page-container">
        <div className="messages-container">
          <div className="messages-sidebar">
            <div className="sidebar-header-message">
              <h2>Messages</h2>
              <button className="new-chat-button" onClick={() => {
                setShowNewChatModal(true);
                fetchAvailableChatUsers(); // Fetch users when modal opens
              }}>
                <Plus size={20} /> Nouvelle discussion
              </button>
            </div>
            <div className="search-container-message">
              <Search size={20} color="#666" />
              <input
                type="text"
                placeholder="Rechercher des conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="conversations-list">
              {loadingConversations ? (
                <div className="loading-message">Chargement des conversations...</div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : filteredConversations.length === 0 ? (
                <div className="no-conversations">Aucune conversation trouvée.</div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`conversation-item ${selectedConversation?.id === conv.id ? "active" : ""}`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className="conversation-avatar-1">
                      {conv.user.avatar ? (
                        <img src={conv.user.avatar} alt={conv.user.name} />
                      ) : (
                        <div className="avatar-placeholder">{getInitials(conv.user.name)}</div>
                      )}
                      <span className={`user-status ${conv.user.status || 'offline'}`}></span>
                    </div>
                    <div className="conversation-info-1">
                      <span className="conversation-name-1">{conv.user.name}</span>
                      <span className="last-message-1">
                        {conv.lastMessage && conv.lastMessage.sender === "you" && "Vous: "}
                        {conv.lastMessage?.text || "Pas de message"}
                      </span>
                    </div>
                    <div className="conversation-meta-1">
                      <span className="message-time-1">{conv.lastMessage?.time}</span>
                      {conv.unreadCount > 0 && <span className="unread-badge-1">{conv.unreadCount}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="chat-area">
            {selectedConversation ? (
              <>
                <div className="chat-header">
                  <div className="chat-header-info">
                    <div className="conversation-avatar">
                      {selectedConversation.user.avatar ? (
                        <img src={selectedConversation.user.avatar} alt={selectedConversation.user.name} />
                      ) : (
                        <div className="avatar-placeholder">{getInitials(selectedConversation.user.name)}</div>
                      )}
                      <span className={`user-status ${selectedConversation.user.status || 'offline'}`}></span>
                    </div>
                    <div className="user-details">
                      <h3>{selectedConversation.user.name}</h3>
                      <p>{selectedConversation.user.status === "online" ? "En ligne" : "Hors ligne"}</p>
                    </div>
                  </div>
                  {/* <div className="chat-actions">
                    <button className="action-button">
                      <Phone size={20} />
                    </button>
                    <button className="action-button">
                      <Video size={20} />
                    </button>
                  </div> */}
                </div>

                <div className="messages-list">
                  {loadingMessages ? (
                    <div className="loading-message">Chargement des messages...</div>
                  ) : error ? (
                    <div className="error-message">{error}</div>
                  ) : messages.length === 0 ? (
                    <div className="no-messages">Aucun message dans cette conversation.</div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`message-bubble ${msg.sender === "you" ? "sent" : "received"}`}
                      >
                        <p>{msg.text}</p>
                        <span className="message-time">
                          {formatMessageTime(msg.time)}
                          {msg.sender === "you" && msg.isRead && <Clock size={12} />}
                          {msg.isSending && <span className="sending-spinner"> ...</span>}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form className="message-input" onSubmit={sendMessage}>
                  <input
                    type="text"
                    placeholder="Écrivez votre message..."
                    value={newMessageBody}
                    onChange={(e) => setNewMessageBody(e.target.value)}
                    disabled={loadingMessages}
                  />
                  <button type="submit" className="send-button-message" disabled={loadingMessages}>
                    <Send size={20} />
                  </button>
                </form>
              </>
            ) : (
              <div className="no-conversation-selected">
                <div className="no-conversation-content">
                  <MessageSquareIcon size={48} />
                  <h3>Aucune conversation sélectionnée</h3>
                  <p>Sélectionnez une conversation pour commencer à discuter</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Chat Modal */}
        {showNewChatModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Démarrer une nouvelle discussion</h3>
              <div className="search-container-modal">
                <Search size={20} color="#666" />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={newChatSearchTerm}
                  onChange={(e) => setNewChatSearchTerm(e.target.value)}
                />
              </div>
              <div className="available-users-list">
                {loadingAvailableUsers ? (
                  <div className="loading-message">Chargement des utilisateurs...</div>
                ) : error ? (
                  <div className="error-message">{error}</div>
                ) : filteredAvailableUsers.length === 0 ? (
                  <div className="no-users">Aucun utilisateur trouvé.</div>
                ) : (
                  filteredAvailableUsers.map((user) => (
                    <div
                      key={user.id}
                      className="available-user-item"
                      onClick={() => handleStartNewConversation(user.id)}
                    >
                      <div className="conversation-avatar">
                        <div className="avatar-placeholder">{getInitials(user.name)}</div>
                      </div>
                      <div className="user-info">
                        <span className="user-name">{user.name}</span>
                        <span className="user-role">{user.role}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowNewChatModal(false)}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default MessagePatient;