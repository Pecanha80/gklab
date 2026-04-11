export interface Goalkeeper {
  id: string;
  name: string;
  category: 'First Team' | 'U23' | 'U18';
  status: 'Ready' | 'Minor Strain' | 'In Training' | 'Injured';
  form: number;
  recovery: number;
  load: number;
  imageUrl: string;
}

export interface Exercise {
  id: string;
  type: 'analytical' | 'decision' | 'contextualized' | 'warmup';
  title: string;
  objective: string;
  organization: string; // space, materials, players
  execution: string;
  progression: string;
  successCriteria: string;
  duration: string;
  intensity: 'low' | 'medium' | 'high';
  diagram?: string; // JSON or Base64 image
}

export interface IntegratedExercise {
  id: string;
  format: string;
  number: string;
  space: string;
  time: string;
}

export interface TrainingSession {
  id: string;
  date: string;
  category: string;
  numAthletes: number;
  duration: string;
  generalObjectives: string[];
  
  // Specific Objectives
  objectives: {
    technical: string;
    tactical: string;
    physical: string;
    cognitive: string;
  };

  warmup: Exercise[]; // Warmup drills

  exercises: Exercise[]; // Main part (1, 2, 3)

  integratedWithTeam?: IntegratedExercise[];

  coolDown: string;

  observations: {
    positives: string;
    adjustments: string;
    individualEval: string;
  };

  // UI metadata
  titles: string[];
  imageUrl?: string;
  isLive?: boolean;
  focus?: string[];
  time?: string;
  attending?: string[];
}

export interface PerformanceVideo {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  imageUrl: string;
  status: 'Analysis Ready' | 'Uncut' | 'Edited';
}
