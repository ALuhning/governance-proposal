// Types for the governance proposal data
export interface ProposalData {
  proposal_title: string;
  proposal_summary: string;
  problem: string;
  solution: string[];
  milestones: string[];
  outcomes: string[];
  stakeholder_impact: string[];
  resources: string[];
  risks: string[];
  alternatives: string[];
  implementation: string[];
  metrics: string[];
  references: string[];
}

// Section names for the proposal form
export enum ProposalSection {
  TITLE = 'proposal_title',
  SUMMARY = 'proposal_summary',
  PROBLEM = 'problem',
  SOLUTION = 'solution',
  MILESTONES = 'milestones',
  OUTCOMES = 'outcomes',
  STAKEHOLDER_IMPACT = 'stakeholder_impact',
  RESOURCES = 'resources',
  RISKS = 'risks',
  ALTERNATIVES = 'alternatives',
  IMPLEMENTATION = 'implementation',
  METRICS = 'metrics',
  REFERENCES = 'references'
}

// FormState Type for tracking the locked state of form sections
export interface ProposalFormState {
  locked: {
    [key in ProposalSection]?: boolean;
  };
  formData: ProposalData;
  setLockStatus: (section: ProposalSection, locked: boolean) => void;
  updateSection: (section: ProposalSection, value: string | string[]) => void;
  setFormData: (data: ProposalData) => void;
  resetForm: () => void;
  allLocked: boolean;
  setAllLocked: (locked: boolean) => void;
}

// Helper type for parsing the response string from Langflow
export type ParsedResponse = { [key in ProposalSection]: string | string[] };
