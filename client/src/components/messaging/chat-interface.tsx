import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { Send, Paperclip, Phone, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  messageType: string;
}

interface Conversation {
  id: string;
  title: string;
  participants: Array<{
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  }>;
}

interface ChatInterfaceProps {
  conversation: Conversation | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
}

export default function ChatInterface({ 
  conversation, 
  messages, 
  onSendMessage, 
  isLoading = false 
}: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { isConnected } = useWebSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !conversation) return;
    
    onSendMessage(newMessage.trim());
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getOtherParticipant = () => {
    if (!conversation || !user) return null;
    return conversation.participants.find(p => p.id !== user.id);
  };

  const getParticipantInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const otherParticipant = getOtherParticipant();

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
          <p className="text-gray-600">Choose a conversation from the sidebar to start messaging.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary">
                {otherParticipant ? 
                  getParticipantInitials(otherParticipant.firstName, otherParticipant.lastName) :
                  "GC"
                }
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium text-gray-900">
                {otherParticipant ? 
                  `${otherParticipant.firstName} ${otherParticipant.lastName}` :
                  conversation.title
                }
              </h4>
              <p className="text-sm text-gray-600">
                {otherParticipant?.role && (
                  <>
                    {otherParticipant.role.charAt(0).toUpperCase() + otherParticipant.role.slice(1)}
                    {isConnected && <span className="ml-2 text-green-600">• Online</span>}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-gray-50">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.senderId === user?.id;
            
            return (
              <div
                key={message.id}
                className={cn(
                  "flex space-x-3",
                  isOwnMessage && "justify-end"
                )}
              >
                {!isOwnMessage && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                      {message.senderName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={cn(
                  "max-w-xs lg:max-w-md",
                  isOwnMessage && "order-1"
                )}>
                  <div className={cn(
                    "message-bubble",
                    isOwnMessage ? "message-bubble-sent" : "message-bubble-received"
                  )}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <p className={cn(
                    "text-xs text-gray-500 mt-1",
                    isOwnMessage ? "text-right" : "text-left"
                  )}>
                    {formatMessageTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          
          {isTyping && (
            <div className="flex items-start space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                  {otherParticipant ? 
                    getParticipantInitials(otherParticipant.firstName, otherParticipant.lastName) :
                    "?"
                  }
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
