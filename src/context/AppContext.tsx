import React, { createContext, useContext, useState } from 'react';

interface AppContextType {
  currentStep: number;
  selectedSector: string | null;
  selectedSubsector: string | null;
  selectedIssues: string[];
  selectedStandards: string[];
  selectedCriteria: string[];
  selectedIndicators: string[];
  organizationCreated: boolean;
  usersCreated: boolean;
  setSector: (sectorName: string) => void;
  setSubsector: (subsectorName: string) => void;
  toggleIssue: (issueName: string) => void;
  toggleStandard: (standardName: string) => void;
  toggleCriteria: (criteriaName: string) => void;
  toggleIndicator: (indicatorName: string) => void;
  setCurrentStep: (step: number) => void;
  setOrganizationCreated: (created: boolean) => void;
  setUsersCreated: (created: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedSubsector, setSelectedSubsector] = useState<string | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [organizationCreated, setOrganizationCreated] = useState(false);
  const [usersCreated, setUsersCreated] = useState(false);

  const setSector = (sectorName: string) => {
    if (selectedSector === sectorName) {
      setSelectedSector(null);
      setSelectedSubsector(null);
    } else {
      setSelectedSector(sectorName);
      setSelectedSubsector(null);
    }
  };

  const setSubsector = (subsectorName: string) => {
    setSelectedSubsector(selectedSubsector === subsectorName ? null : subsectorName);
  };

  const toggleIssue = (issueName: string) => {
    setSelectedIssues(prev =>
      prev.includes(issueName)
        ? prev.filter(name => name !== issueName)
        : [...prev, issueName]
    );
  };

  const toggleStandard = (standardName: string) => {
    setSelectedStandards(prev =>
      prev.includes(standardName)
        ? prev.filter(name => name !== standardName)
        : [...prev, standardName]
    );
  };

  const toggleCriteria = (criteriaName: string) => {
    setSelectedCriteria(prev =>
      prev.includes(criteriaName)
        ? prev.filter(name => name !== criteriaName)
        : [...prev, criteriaName]
    );
  };

  const toggleIndicator = (indicatorName: string) => {
    setSelectedIndicators(prev =>
      prev.includes(indicatorName)
        ? prev.filter(name => name !== indicatorName)
        : [...prev, indicatorName]
    );
  };

  return (
    <AppContext.Provider value={{ 
      currentStep,
      selectedSector, 
      selectedSubsector,
      selectedIssues,
      selectedStandards,
      selectedCriteria,
      selectedIndicators,
      organizationCreated,
      usersCreated,
      setSector,
      setSubsector,
      toggleIssue,
      toggleStandard,
      toggleCriteria,
      toggleIndicator,
      setCurrentStep,
      setOrganizationCreated,
      setUsersCreated
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}