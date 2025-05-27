import { create } from 'zustand';

export interface ValidationIssue {
  type: string;
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  position: {
    start: number;
    end: number;
  };
}

export interface ValidationResult {
  is_valid: boolean;
  issues: ValidationIssue[];
  suggestions: string[];
  compliance_score: number;
  timestamp: string;
}

export interface AIMessage {
  type: 'analysis' | 'chat' | 'pong' | 'error' | 'document_update';
  result?: ValidationResult | string | DocumentUpdate;
  message?: string;
  timestamp: string;
}

export interface DocumentUpdate {
  action: 'replace' | 'insert' | 'append' | 'update_style';
  content?: string;
  position?: {
    start?: number;
    end?: number;
  };
  style?: {
    font?: string;
    fontSize?: number;
    lineHeight?: number;
    securityLevel?: string;
  };
}

interface AIWebSocketStore {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  messages: AIMessage[];
  lastValidation: ValidationResult | null;
  connectionAttempts: number;
  maxReconnectAttempts: number;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: any) => void;
  analyzeDocument: (content: string, securityLevel?: string) => void;
  sendChatMessage: (message: string, documentContent?: string, history?: any[]) => void;
  clearMessages: () => void;
  ping: () => void;
}

const AI_WEBSOCKET_URL = process.env.NEXT_PUBLIC_AI_WEBSOCKET_URL || 'ws://localhost:8000/ws';
const RECONNECT_DELAY = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 3; // 최대 재연결 시도 횟수

let connectInstance: (() => void) | null = null;
let disconnectInstance: (() => void) | null = null;
let sendMessageInstance: ((message: any) => void) | null = null;
let analyzeDocumentInstance: ((content: string, securityLevel?: string) => void) | null = null;
let sendChatMessageInstance: ((message: string, documentContent?: string, history?: any[]) => void) | null = null;
let pingInstance: (() => void) | null = null;
let clearMessagesInstance: (() => void) | null = null;

export const useAIWebSocket = create<AIWebSocketStore>((set, get) => {
  // Stable function references
  if (!connectInstance) {
    connectInstance = () => {
      const state = get();
      
      // Don't connect if already connected or connecting
      if (state.socket?.readyState === WebSocket.OPEN || state.isConnecting) {
        return;
      }
      
      // Don't reconnect if max attempts reached
      if (state.connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('Max reconnection attempts reached');
        return;
      }
      
      set({ isConnecting: true });
      
      try {
        const socket = new WebSocket(AI_WEBSOCKET_URL);
        
        socket.onopen = () => {
          console.log('AI WebSocket connected');
          set({ 
            isConnected: true, 
            isConnecting: false, 
            connectionAttempts: 0,
            socket,
            maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS
          });
          
          // Send ping to verify connection
          get().ping();
        };
        
        socket.onmessage = (event) => {
          try {
            const message: AIMessage = JSON.parse(event.data);
            
            set(state => ({ 
              messages: [...state.messages, message] 
            }));
            
            // Update last validation if it's an analysis result
            if (message.type === 'analysis' && message.result) {
              set({ lastValidation: message.result as ValidationResult });
            }
            
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        socket.onclose = (event) => {
          console.log('AI WebSocket disconnected:', event.code, event.reason);
          set({ 
            isConnected: false, 
            isConnecting: false, 
            socket: null 
          });
          
          // Auto-reconnect if not a manual disconnect
          if (event.code !== 1000) {
            const currentAttempts = get().connectionAttempts;
            set({ connectionAttempts: currentAttempts + 1 });
            
            setTimeout(() => {
              get().connect();
            }, RECONNECT_DELAY);
          }
        };
        
        socket.onerror = (error) => {
          console.error('AI WebSocket error:', error);
          set({ 
            isConnecting: false,
            isConnected: false 
          });
        };
        
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        set({ 
          isConnecting: false,
          connectionAttempts: get().connectionAttempts + 1 
        });
      }
    };
  }
  
  if (!disconnectInstance) {
    disconnectInstance = () => {
      const { socket } = get();
      if (socket) {
        socket.close(1000, 'Manual disconnect'); // Normal closure
        set({ 
          socket: null, 
          isConnected: false, 
          isConnecting: false,
          connectionAttempts: 0 
        });
      }
    };
  }
  
  if (!sendMessageInstance) {
    sendMessageInstance = (message) => {
      const { socket, isConnected } = get();
      if (socket && isConnected) {
        try {
          socket.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
        }
      } else {
        console.warn('Cannot send message: WebSocket not connected');
        // Try to reconnect
        get().connect();
      }
    };
  }
  
  if (!analyzeDocumentInstance) {
    analyzeDocumentInstance = (content: string, securityLevel: string = '일반') => {
      get().sendMessage({
        type: 'analyze',
        content,
        security_level: securityLevel
      });
    };
  }
  
  if (!sendChatMessageInstance) {
    sendChatMessageInstance = (message: string, documentContent?: string, history: any[] = []) => {
      get().sendMessage({
        type: 'chat',
        message,
        document_content: documentContent,
        history
      });
    };
  }
  
  if (!pingInstance) {
    pingInstance = () => {
      get().sendMessage({
        type: 'ping'
      });
    };
  }
  
  if (!clearMessagesInstance) {
    clearMessagesInstance = () => {
      set({ messages: [], lastValidation: null });
    };
  }
  
  return {
    socket: null,
    isConnected: false,
    isConnecting: false,
    messages: [],
    lastValidation: null,
    connectionAttempts: 0,
    maxReconnectAttempts: 3,
    
    // Actions - use stable references
    connect: connectInstance,
    disconnect: disconnectInstance,
    sendMessage: sendMessageInstance,
    analyzeDocument: analyzeDocumentInstance,
    sendChatMessage: sendChatMessageInstance,
    ping: pingInstance,
    clearMessages: clearMessagesInstance
  };
}); 