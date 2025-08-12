import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";
import ChatInterface from "@/components/messaging/chat-interface";
import { Plus, Search, MessageSquare } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  participants: Array<{
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  }>;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderName: string;
  };
  unreadCount: number;
}

export default function Messaging() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessageContent, setNewMessageContent] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sendMessage: wsendMessage } = useWebSocket();

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/conversations", selectedConversation?.id, "messages"],
    enabled: !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversation) throw new Error("No conversation selected");
      
      const response = await apiRequest("POST", `/api/conversations/${selectedConversation.id}/messages`, {
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation?.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Listen for new messages via WebSocket
  useEffect(() => {
    const handleNewMessage = (event: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (selectedConversation) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/conversations", selectedConversation.id, "messages"] 
        });
      }
    };

    window.addEventListener("new_message", handleNewMessage);
    return () => window.removeEventListener("new_message", handleNewMessage);
  }, [selectedConversation, queryClient]);

  const handleSendMessage = (content: string) => {
    sendMessageMutation.mutate(content);
  };

  const getOtherParticipant = (conversation: Conversation) => {
    if (!user) return null;
    return conversation.participants.find(p => p.id !== user.id);
  };

  const getParticipantInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter((conv: Conversation) => {
    const otherParticipant = getOtherParticipant(conv);
    if (!otherParticipant) return true;
    
    const participantName = `${otherParticipant.firstName} ${otherParticipant.lastName}`.toLowerCase();
    return participantName.includes(searchTerm.toLowerCase()) || 
           conv.title?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="h-[calc(100vh-12rem)] bg-white rounded-lg shadow-sm border border-gray-200 flex">
        {/* Conversations Sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
              <Button size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {conversationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner w-6 h-6"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-sm font-medium text-gray-900 mb-2">No conversations</h4>
                <p className="text-xs text-gray-600">
                  {searchTerm ? "No conversations match your search" : "Start a new conversation to get started"}
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredConversations.map((conversation: Conversation) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  const isSelected = selectedConversation?.id === conversation.id;
                  
                  return (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-primary/10 border-l-4 border-l-primary' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {otherParticipant ? 
                              getParticipantInitials(otherParticipant.firstName, otherParticipant.lastName) :
                              "GC"
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {otherParticipant ? 
                                `${otherParticipant.firstName} ${otherParticipant.lastName}` :
                                conversation.title
                              }
                            </p>
                            {conversation.lastMessage && (
                              <p className="text-xs text-gray-500">
                                {formatLastMessageTime(conversation.lastMessage.createdAt)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-600 truncate">
                              {conversation.lastMessage?.content || "No messages yet"}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <ChatInterface
          conversation={selectedConversation}
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={sendMessageMutation.isPending || messagesLoading}
        />
      </div>
    </div>
  );
}
