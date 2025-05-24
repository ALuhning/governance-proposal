import { create } from 'zustand';
import type { ProposalData, ProposalFormState } from '../types/proposalTypes';
import { ProposalSection } from '../types/proposalTypes';

// Default empty proposal data
const DEFAULT_PROPOSAL_DATA: ProposalData = {
  proposal_title: '',
  proposal_summary: '',
  problem: '',
  solution: [],
  milestones: [],
  outcomes: [],
  stakeholder_impact: [],
  resources: [],
  risks: [],
  alternatives: [],
  implementation: [],
  metrics: [],
  references: []
};

// Create the Zustand store for managing proposal form state
export const useProposalStore = create<ProposalFormState>((set) => ({
  // Initial state
  locked: {},
  formData: { ...DEFAULT_PROPOSAL_DATA },
  allLocked: false,
  
  // Actions
  setLockStatus: (section, locked) => 
    set((state) => ({
      locked: {
        ...state.locked,
        [section]: locked
      }
    })),
  
  updateSection: (section, value) => 
    set((state) => ({
      formData: {
        ...state.formData,
        [section]: value
      }
    })),
  
  setFormData: (data) => 
    set(() => ({
      formData: data
    })),
  
  resetForm: () => 
    set(() => ({
      formData: { ...DEFAULT_PROPOSAL_DATA },
      locked: {},
      allLocked: false
    })),
  
  setAllLocked: (locked) => 
    set(() => {
      const lockedState: Record<string, boolean> = {};
      
      // Set all sections to the same lock state
      Object.values(ProposalSection).forEach((section) => {
        lockedState[section] = locked;
      });
      
      return {
        locked: lockedState,
        allLocked: locked
      };
    })
}));
