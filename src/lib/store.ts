import { create } from 'zustand'

// 보안 등급 타입
export type SecurityLevel = 'NORMAL' | 'CONFIDENTIAL' | 'SECRET_II' | 'SECRET_I';

// 문서 관련 상태 관리
interface DocumentState {
  currentDocument: {
    id: string | null;
    title: string;
    content: string;
    securityLevel: SecurityLevel;
  };
  isDirty: boolean;
  lastSaved: string | null;
  setDocument: (document: Partial<DocumentState['currentDocument']>) => void;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  setSecurityLevel: (level: SecurityLevel) => void;
  markAsSaved: () => void;
  markAsDirty: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  currentDocument: {
    id: null,
    title: '새 문서',
    content: '',
    securityLevel: 'NORMAL',
  },
  isDirty: false,
  lastSaved: null,
  setDocument: (document) => 
    set((state) => ({ 
      currentDocument: { ...state.currentDocument, ...document },
      isDirty: true
    })),
  setTitle: (title) => 
    set((state) => ({ 
      currentDocument: { ...state.currentDocument, title },
      isDirty: true
    })),
  setContent: (content) => 
    set((state) => ({ 
      currentDocument: { ...state.currentDocument, content },
      isDirty: true
    })),
  setSecurityLevel: (securityLevel) => 
    set((state) => ({ 
      currentDocument: { ...state.currentDocument, securityLevel },
      isDirty: true
    })),
  markAsSaved: () => 
    set(() => ({ 
      isDirty: false, 
      lastSaved: new Date().toISOString() 
    })),
  markAsDirty: () => 
    set(() => ({ 
      isDirty: true 
    })),
}))

// UI 상태 관리
interface UIState {
  activePanel: 'preview' | 'code';
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  setActivePanel: (panel: UIState['activePanel']) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activePanel: 'preview',
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  setActivePanel: (activePanel) => set({ activePanel }),
  toggleLeftPanel: () => set((state) => ({ leftPanelCollapsed: !state.leftPanelCollapsed })),
  toggleRightPanel: () => set((state) => ({ rightPanelCollapsed: !state.rightPanelCollapsed })),
})) 